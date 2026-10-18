/**
 * In-Memory Document Store & Hybrid Retrieval Engine
 */

import * as pdfParseModule from 'pdf-parse';
const pdfParse: any = (pdfParseModule as any).default || pdfParseModule;
import mammoth from 'mammoth';
import { GoogleGenAI } from '@google/genai';
import { DocumentMetadata, DocumentChunk, FileType, IngestionStatus } from '../src/types/index.js';
import { DEMO_DOCUMENTS, DemoDocDefinition } from './demoData.js';

interface StoredDocument extends DocumentMetadata {
  rawText: string;
}

interface StoredChunk extends DocumentChunk {
  embedding?: number[];
  termFrequencies: Map<string, number>;
}

export class DocumentStore {
  private documents: Map<string, StoredDocument> = new Map();
  private chunks: Map<string, StoredChunk> = new Map();
  private aiClient: GoogleGenAI | null = null;
  private documentFrequency: Map<string, number> = new Map();
  private totalWordCount: number = 0;

  constructor() {
    this.initGeminiClient();
    this.seedDemoDocuments();
  }

  private initGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        this.aiClient = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
      } catch (err) {
        console.warn('[DocumentStore] Failed to initialize GoogleGenAI client:', err);
      }
    }
  }

  public getGeminiClient(): GoogleGenAI | null {
    if (!this.aiClient && process.env.GEMINI_API_KEY) {
      this.initGeminiClient();
    }
    return this.aiClient;
  }

  public getAllDocuments(): DocumentMetadata[] {
    return Array.from(this.documents.values()).map(doc => {
      const { rawText, ...meta } = doc;
      return meta;
    });
  }

  public getDocument(id: string): StoredDocument | undefined {
    return this.documents.get(id);
  }

  public getChunksForDocument(documentId: string): DocumentChunk[] {
    return Array.from(this.chunks.values())
      .filter(c => c.documentId === documentId)
      .map(({ termFrequencies, embedding, ...rest }) => rest);
  }

  public getAllChunks(): DocumentChunk[] {
    return Array.from(this.chunks.values())
      .map(({ termFrequencies, embedding, ...rest }) => rest);
  }

  public deleteDocument(id: string): boolean {
    if (!this.documents.has(id)) return false;

    // Delete chunks
    for (const [chunkId, chunk] of this.chunks.entries()) {
      if (chunk.documentId === id) {
        this.chunks.delete(chunkId);
      }
    }

    this.documents.delete(id);
    this.rebuildInvertedIndex();
    return true;
  }

  public resetToDemo(): DocumentMetadata[] {
    this.documents.clear();
    this.chunks.clear();
    this.seedDemoDocuments();
    return this.getAllDocuments();
  }

  private seedDemoDocuments() {
    for (const demoDoc of DEMO_DOCUMENTS) {
      this.processRawTextDocument(
        demoDoc.id,
        demoDoc.title,
        demoDoc.filename,
        demoDoc.fileType,
        demoDoc.content,
        demoDoc.content.length,
        true
      );
    }
    this.rebuildInvertedIndex();
  }

  /**
   * Process an uploaded file buffer
   */
  public async ingestFile(
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType: string,
    fileSize: number
  ): Promise<DocumentMetadata> {
    const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const ext = originalFilename.split('.').pop()?.toLowerCase() || '';
    let fileType: FileType = 'unknown';

    if (ext === 'pdf' || mimeType.includes('pdf')) fileType = 'pdf';
    else if (ext === 'docx' || mimeType.includes('wordprocessingml')) fileType = 'docx';
    else if (ext === 'txt' || mimeType.includes('text/plain')) fileType = 'txt';
    else if (ext === 'md' || ext === 'markdown') fileType = 'md';
    else {
      throw new Error(`Unsupported file type: .${ext}. PharmaSource AI accepts PDF, DOCX, TXT, and Markdown files.`);
    }

    if (fileSize > 25 * 1024 * 1024) {
      throw new Error(`File size (${(fileSize / (1024 * 1024)).toFixed(1)} MB) exceeds the 25 MB prototype limit.`);
    }

    let extractedText = '';
    let extractedPages = 1;

    try {
      if (fileType === 'pdf') {
        const parsed = await pdfParse(fileBuffer);
        extractedText = parsed.text || '';
        extractedPages = parsed.numpages || 1;
      } else if (fileType === 'docx') {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        extractedText = result.value || '';
        extractedPages = Math.max(1, Math.ceil(extractedText.split(/\s+/).length / 450));
      } else {
        extractedText = fileBuffer.toString('utf-8');
        const pageMatches = extractedText.match(/\[PAGE\s+\d+\]/gi);
        extractedPages = pageMatches ? pageMatches.length : Math.max(1, Math.ceil(extractedText.split(/\s+/).length / 450));
      }
    } catch (parseErr: any) {
      console.error('[DocumentStore] Parsing error:', parseErr);
      throw new Error(`Failed to parse document text: ${parseErr.message || 'Corrupt or unreadable file.'}`);
    }

    const words = extractedText.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    // Check for low-text / scanned PDF
    let status: IngestionStatus = 'ready';
    let warning: string | undefined = undefined;

    if (wordCount < 40) {
      status = 'warning_low_text';
      warning = 'Low text density or scanned document detected. Text extraction produced minimal content (< 40 words). OCR is required for image-based PDFs.';
    }

    // Clean title from filename
    const title = originalFilename
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());

    const docMeta = this.processRawTextDocument(
      docId,
      title,
      originalFilename,
      fileType,
      extractedText,
      fileSize,
      false,
      extractedPages,
      status,
      warning
    );

    this.rebuildInvertedIndex();
    return docMeta;
  }

  private processRawTextDocument(
    id: string,
    title: string,
    filename: string,
    fileType: FileType,
    rawText: string,
    fileSize: number,
    isDemo: boolean,
    pageCount: number = 1,
    initialStatus: IngestionStatus = 'ready',
    warning?: string
  ): DocumentMetadata {
    const chunks = this.createChunks(id, title, filename, rawText);
    const wordCount = rawText.split(/\s+/).filter(w => w.length > 0).length;

    const doc: StoredDocument = {
      id,
      title,
      filename,
      fileType,
      fileSize,
      uploadDate: new Date().toISOString(),
      isDemo,
      pageCount: Math.max(pageCount, Math.max(...chunks.map(c => c.pageNumber), 1)),
      chunkCount: chunks.length,
      status: initialStatus,
      warning,
      extractedWordCount: wordCount,
      rawText,
    };

    this.documents.set(id, doc);

    for (const chunk of chunks) {
      this.chunks.set(chunk.id, chunk);
    }

    return {
      id: doc.id,
      title: doc.title,
      filename: doc.filename,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      uploadDate: doc.uploadDate,
      isDemo: doc.isDemo,
      pageCount: doc.pageCount,
      chunkCount: doc.chunkCount,
      status: doc.status,
      warning: doc.warning,
      extractedWordCount: doc.extractedWordCount,
    };
  }

  /**
   * Split document into meaningful overlapping chunks with page and section tracking
   */
  private createChunks(
    documentId: string,
    documentTitle: string,
    filename: string,
    text: string
  ): StoredChunk[] {
    const chunks: StoredChunk[] = [];
    const lines = text.split(/\r?\n/);
    
    let currentPage = 1;
    let currentSection = 'General Overview';
    let currentBlock = '';
    let chunkIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Detect Page Markers
      const pageMatch = line.match(/^\[PAGE\s+(\d+)\]/i);
      if (pageMatch) {
        currentPage = parseInt(pageMatch[1], 10);
        continue;
      }

      // Detect Section Headings (Markdown # or SECTION X:)
      const sectionMatch = line.match(/^(?:#+\s*|SECTION\s+\d+[:\-]?\s*|DOCUMENT TITLE:?\s*)(.+)/i);
      if (sectionMatch) {
        currentSection = sectionMatch[1].trim();
      }

      currentBlock += line + ' ';

      const words = currentBlock.trim().split(/\s+/);
      // Chunk threshold: ~220-300 words
      if (words.length >= 250 || (words.length >= 150 && sectionMatch && i > 0)) {
        const chunkText = words.join(' ');
        const chunkId = `CHUNK-${documentId.replace(/[^a-zA-Z0-9]/g, '')}-${chunkIndex + 1}`;
        
        chunks.push({
          id: chunkId,
          documentId,
          documentTitle,
          filename,
          chunkIndex: chunkIndex + 1,
          text: chunkText,
          pageNumber: currentPage,
          sectionHeading: currentSection,
          wordCount: words.length,
          termFrequencies: this.computeTermFrequencies(chunkText),
        });

        chunkIndex++;
        // Keep 40-word overlap for contextual continuity
        const overlapWords = words.slice(Math.max(0, words.length - 40));
        currentBlock = overlapWords.join(' ') + ' ';
      }
    }

    // Flush remaining words
    const remainingWords = currentBlock.trim().split(/\s+/).filter(w => w.length > 0);
    if (remainingWords.length > 15) {
      const chunkText = remainingWords.join(' ');
      const chunkId = `CHUNK-${documentId.replace(/[^a-zA-Z0-9]/g, '')}-${chunkIndex + 1}`;
      chunks.push({
        id: chunkId,
        documentId,
        documentTitle,
        filename,
        chunkIndex: chunkIndex + 1,
        text: chunkText,
        pageNumber: currentPage,
        sectionHeading: currentSection,
        wordCount: remainingWords.length,
        termFrequencies: this.computeTermFrequencies(chunkText),
      });
    }

    return chunks;
  }

  private computeTermFrequencies(text: string): Map<string, number> {
    const tf = new Map<string, number>();
    const tokens = this.tokenize(text);
    for (const token of tokens) {
      tf.set(token, (tf.get(token) || 0) + 1);
    }
    return tf;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\-\.\/]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);
  }

  private rebuildInvertedIndex() {
    this.documentFrequency.clear();
    this.totalWordCount = 0;

    for (const chunk of this.chunks.values()) {
      this.totalWordCount += chunk.wordCount;
      const seenTerms = new Set<string>();
      for (const term of chunk.termFrequencies.keys()) {
        if (!seenTerms.has(term)) {
          seenTerms.add(term);
          this.documentFrequency.set(term, (this.documentFrequency.get(term) || 0) + 1);
        }
      }
    }
  }

  /**
   * Hybrid Search: Combines BM25 lexical search with semantic cosine similarity
   */
  public searchChunks(
    query: string,
    filterDocumentIds?: string[],
    topK: number = 7,
    threshold: number = 0.18
  ): DocumentChunk[] {
    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) return [];

    const activeChunks = Array.from(this.chunks.values()).filter(c => {
      if (filterDocumentIds && filterDocumentIds.length > 0) {
        return filterDocumentIds.includes(c.documentId);
      }
      return true;
    });

    if (activeChunks.length === 0) return [];

    const N = activeChunks.length;
    const avgDocLength = this.totalWordCount / (this.chunks.size || 1);
    const k1 = 1.5;
    const b = 0.75;

    // Detect specialized pharmaceutical acronyms or phrases to boost
    const upperQuery = query.toUpperCase();
    const pharmaceuticalKeywords = [
      'PFS', 'OS', 'ORR', 'ILD', 'ADC', 'WAC', 'TROP-2', 'TROP2', 'HER2', 'DESTINY-ZEN',
      'ZELTAXIMAB', 'TRODELVY', 'ENHERTU', 'ASMR', 'G-BA', 'NICE', 'QALY', 'FDA', 'EMA',
      'HRCT', 'DAR', 'DXD', 'TNBC', 'PNEUMONITIS', 'DOSE', 'STORAGE'
    ];

    const scoredChunks: Array<{ chunk: StoredChunk; score: number }> = [];

    for (const chunk of activeChunks) {
      let bm25Score = 0;
      let matchedTerms = 0;

      for (const token of queryTokens) {
        const tf = chunk.termFrequencies.get(token) || 0;
        if (tf > 0) {
          matchedTerms++;
          const df = this.documentFrequency.get(token) || 1;
          const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);
          const numerator = tf * (k1 + 1);
          const denominator = tf + k1 * (1 - b + b * (chunk.wordCount / avgDocLength));
          bm25Score += idf * (numerator / denominator);
        }
      }

      // Keyword boost for exact acronyms/drugs
      for (const kw of pharmaceuticalKeywords) {
        if (upperQuery.includes(kw) && chunk.text.toUpperCase().includes(kw)) {
          bm25Score += 2.5;
        }
      }

      // Exact phrase match boost
      const cleanQuery = query.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim();
      if (cleanQuery.length > 5 && chunk.text.toLowerCase().includes(cleanQuery)) {
        bm25Score += 3.0;
      }

      // Calculate term-frequency semantic cosine proxy
      const queryTf = new Map<string, number>();
      for (const t of queryTokens) queryTf.set(t, (queryTf.get(t) || 0) + 1);

      let dotProduct = 0;
      let qMagnitude = 0;
      let docMagnitude = 0;

      for (const [t, qCount] of queryTf.entries()) {
        const dCount = chunk.termFrequencies.get(t) || 0;
        dotProduct += qCount * dCount;
        qMagnitude += qCount * qCount;
      }

      for (const dCount of chunk.termFrequencies.values()) {
        docMagnitude += dCount * dCount;
      }

      const semanticCosine = (qMagnitude > 0 && docMagnitude > 0)
        ? (dotProduct / (Math.sqrt(qMagnitude) * Math.sqrt(docMagnitude)))
        : 0;

      // Normalized Hybrid Score (0 to 1 scale)
      const normalizedBm25 = Math.min(1.0, bm25Score / 12.0);
      const hybridScore = (semanticCosine * 0.45) + (normalizedBm25 * 0.55);

      if (hybridScore >= threshold || matchedTerms >= 2) {
        scoredChunks.push({
          chunk,
          score: Math.min(0.99, Math.max(0.1, hybridScore)),
        });
      }
    }

    // Sort by descending score
    scoredChunks.sort((a, b) => b.score - a.score);

    return scoredChunks.slice(0, topK).map(({ chunk, score }) => ({
      id: chunk.id,
      documentId: chunk.documentId,
      documentTitle: chunk.documentTitle,
      filename: chunk.filename,
      chunkIndex: chunk.chunkIndex,
      text: chunk.text,
      pageNumber: chunk.pageNumber,
      sectionHeading: chunk.sectionHeading,
      wordCount: chunk.wordCount,
      similarityScore: parseFloat(score.toFixed(3)),
    }));
  }
}

export const documentStore = new DocumentStore();

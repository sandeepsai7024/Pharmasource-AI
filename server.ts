/**
 * PharmaSource AI - Node.js Express Backend & Vite Dev Server
 */

import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { documentStore } from './server/documentStore.js';
import { generateGroundedAnswer } from './server/geminiService.js';
import { runEvaluationSuite, EVALUATION_TEST_CASES } from './server/evalService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Multer memory storage for uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB prototype cap
});

// ==========================================
// API ROUTES
// ==========================================

// Health & Environment Check
app.get('/api/health', (req: Request, res: Response) => {
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;
  res.json({
    status: 'healthy',
    hasGeminiKey,
    documentCount: documentStore.getAllDocuments().length,
    chunkCount: documentStore.getAllChunks().length,
    timestamp: new Date().toISOString(),
  });
});

// List all documents in workspace
app.get('/api/documents', (req: Request, res: Response) => {
  try {
    const docs = documentStore.getAllDocuments();
    res.json({ documents: docs });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list documents' });
  }
});

// Get single document details & chunks
app.get('/api/documents/:id', (req: Request, res: Response) => {
  try {
    const doc = documentStore.getDocument(req.params.id);
    if (!doc) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    const chunks = documentStore.getChunksForDocument(req.params.id);
    res.json({
      document: doc,
      chunks,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get document' });
  }
});

// Upload Document(s)
app.post('/api/documents/upload', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files provided in upload request' });
      return;
    }

    const ingestedDocs = [];
    const errors = [];

    for (const file of files) {
      try {
        const doc = await documentStore.ingestFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          file.size
        );
        ingestedDocs.push(doc);
      } catch (err: any) {
        errors.push({ filename: file.originalname, error: err.message });
      }
    }

    res.json({
      success: ingestedDocs.length > 0,
      ingested: ingestedDocs,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'File ingestion failed' });
  }
});

// Delete Document
app.delete('/api/documents/:id', (req: Request, res: Response) => {
  try {
    const deleted = documentStore.deleteDocument(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Deletion failed' });
  }
});

// Reset Document Library to Synthetic Demonstration Collection
app.post('/api/documents/reset-demo', (req: Request, res: Response) => {
  try {
    const docs = documentStore.resetToDemo();
    res.json({
      success: true,
      documents: docs,
      message: 'Workspace document collection restored to synthetic oncology demonstration set.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Reset failed' });
  }
});

// Research Assistant: Ask Question / Query Documents
app.post('/api/chat/query', async (req: Request, res: Response) => {
  try {
    const { question, selectedDocumentIds } = req.body;
    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'A non-empty question string is required.' });
      return;
    }

    const answerPayload = await generateGroundedAnswer(question, selectedDocumentIds);
    res.json(answerPayload);
  } catch (err: any) {
    console.error('[API /api/chat/query] Error:', err);
    res.status(500).json({
      error: err.message || 'Failed to process research query',
    });
  }
});

// Evaluation Lab: Get Benchmark Test Cases
app.get('/api/eval/tests', (req: Request, res: Response) => {
  res.json({ tests: EVALUATION_TEST_CASES });
});

// Evaluation Lab: Execute Benchmark Runner
app.post('/api/eval/run', async (req: Request, res: Response) => {
  try {
    const { testIds } = req.body;
    const { results, summary } = await runEvaluationSuite(testIds);
    res.json({ results, summary });
  } catch (err: any) {
    console.error('[API /api/eval/run] Error:', err);
    res.status(500).json({ error: err.message || 'Benchmark execution failed' });
  }
});

// ==========================================
// VITE INTEGRATION / STATIC SERVING
// ==========================================

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PharmaSource AI] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[PharmaSource AI] Failed to start server:', err);
  process.exit(1);
});

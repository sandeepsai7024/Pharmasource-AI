/**
 * PharmaSource AI - Type Definitions
 */

export type FileType = 'pdf' | 'docx' | 'txt' | 'md' | 'unknown';

export type IngestionStatus = 'ready' | 'processing' | 'error' | 'warning_low_text';

export type EvidenceStrength = 
  | 'Supported' 
  | 'Partially Supported' 
  | 'Insufficient Evidence' 
  | 'Conflicting Evidence';

export interface DocumentMetadata {
  id: string;
  title: string;
  filename: string;
  fileType: FileType;
  fileSize: number;
  uploadDate: string;
  isDemo: boolean;
  pageCount: number;
  chunkCount: number;
  status: IngestionStatus;
  warning?: string;
  sourceUrl?: string;
  extractedWordCount: number;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  filename: string;
  chunkIndex: number;
  text: string;
  pageNumber: number;
  sectionHeading: string;
  wordCount: number;
  similarityScore?: number;
}

export interface Citation {
  id: string;
  chunkId: string;
  documentId: string;
  documentTitle: string;
  filename: string;
  pageNumber: number;
  sectionHeading: string;
  excerptText: string;
  similarityScore: number;
  isVerified: boolean;
}

export interface KeyFinding {
  claim: string;
  citationIds: string[];
  isSupported?: boolean;
}

export interface AnswerPayload {
  directAnswer: string;
  keyFindings: KeyFinding[];
  evidenceStrength: EvidenceStrength;
  citations: Citation[];
  limitations: string;
  sourcesSearchedCount: number;
  passagesRetrievedCount: number;
  validationWarnings: string[];
  query: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  answerPayload?: AnswerPayload;
  timestamp: string;
  isError?: boolean;
  isLoading?: boolean;
}

export type EvaluationCategory = 
  | 'answerable'
  | 'partially_answerable'
  | 'unanswerable'
  | 'conflicting_evidence'
  | 'citation_validity'
  | 'prompt_injection'
  | 'out_of_scope_clinical';

export interface EvaluationTestCase {
  id: string;
  category: EvaluationCategory;
  categoryTitle: string;
  question: string;
  expectedBehavior: string;
  targetDocumentIds?: string[];
}

export interface EvaluationTestResult {
  testId: string;
  category: EvaluationCategory;
  passed: boolean;
  question: string;
  expectedBehavior: string;
  actualDirectAnswer: string;
  actualEvidenceStrength: EvidenceStrength;
  citationCount: number;
  citationValidityRate: number;
  notes: string;
  executionTimeMs: number;
  answerPayload?: AnswerPayload;
}

export interface EvaluationSummary {
  totalExecuted: number;
  passedCount: number;
  failedCount: number;
  passRate: number;
  citationValidityRate: number;
  unsupportedAnswerRate: number;
  correctAbstentionRate: number;
  lastRunTimestamp?: string;
}

/**
 * Frontend API Service
 */

import { DocumentMetadata, AnswerPayload, DocumentChunk, EvaluationTestResult, EvaluationSummary, EvaluationTestCase } from '../types/index.js';

export async function fetchHealth(): Promise<{ status: string; hasGeminiKey: boolean; documentCount: number }> {
  const res = await fetch('/api/health');
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchDocuments(): Promise<DocumentMetadata[]> {
  const res = await fetch('/api/documents');
  if (!res.ok) throw new Error('Failed to fetch documents');
  const data = await res.json();
  return data.documents || [];
}

export async function fetchDocumentDetails(id: string): Promise<{ document: DocumentMetadata; chunks: DocumentChunk[] }> {
  const res = await fetch(`/api/documents/${id}`);
  if (!res.ok) throw new Error('Failed to fetch document details');
  return res.json();
}

export async function uploadDocuments(files: File[]): Promise<{ ingested: DocumentMetadata[]; errors?: any[] }> {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }

  const res = await fetch('/api/documents/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Upload failed');
  }
  return data;
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`/api/documents/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete document');
  }
}

export async function resetDemoDocuments(): Promise<DocumentMetadata[]> {
  const res = await fetch('/api/documents/reset-demo', {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to reset demo documents');
  const data = await res.json();
  return data.documents || [];
}

export async function submitResearchQuery(
  question: string,
  selectedDocumentIds?: string[]
): Promise<AnswerPayload> {
  const res = await fetch('/api/chat/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, selectedDocumentIds }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to generate research answer');
  }
  return data;
}

export async function fetchEvaluationTests(): Promise<EvaluationTestCase[]> {
  const res = await fetch('/api/eval/tests');
  if (!res.ok) throw new Error('Failed to fetch evaluation tests');
  const data = await res.json();
  return data.tests || [];
}

export async function runEvaluationSuite(testIds?: string[]): Promise<{
  results: EvaluationTestResult[];
  summary: EvaluationSummary;
}> {
  const res = await fetch('/api/eval/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ testIds }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to execute evaluation suite');
  }
  return data;
}

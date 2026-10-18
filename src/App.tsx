/**
 * PharmaSource AI - Main Application Entry
 * "Find the evidence. Understand the source."
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { ResearchAssistant } from './components/ResearchAssistant.js';
import { DocumentLibrary } from './components/DocumentLibrary.js';
import { EvaluationLab } from './components/EvaluationLab.js';
import { AboutModal } from './components/AboutModal.js';
import { DocumentUploadModal } from './components/DocumentUploadModal.js';
import { DocumentPreviewModal } from './components/DocumentPreviewModal.js';
import {
  fetchDocuments,
  resetDemoDocuments,
  deleteDocument,
  fetchEvaluationTests
} from './services/api.js';
import { DocumentMetadata, ChatMessage, EvaluationTestCase } from './types/index.js';
import { Sparkles, ShieldAlert, AlertTriangle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'assistant' | 'library' | 'eval' | 'about'>('assistant');
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [evaluationTests, setEvaluationTests] = useState<EvaluationTestCase[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [appError, setAppError] = useState<string | null>(null);

  // Load documents and benchmark tests on initial mount
  useEffect(() => {
    loadDocuments();
    fetchEvaluationTests()
      .then(tests => setEvaluationTests(tests))
      .catch(err => console.warn('Could not prefetch evaluation tests:', err));
  }, []);

  const loadDocuments = async () => {
    try {
      setAppError(null);
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch (err: any) {
      setAppError('Failed to load workspace documents: ' + (err.message || 'Server offline'));
    }
  };

  const handleResetDemo = async () => {
    try {
      const docs = await resetDemoDocuments();
      setDocuments(docs);
    } catch (err: any) {
      setAppError('Failed to reset demo dataset: ' + err.message);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await deleteDocument(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err: any) {
      setAppError('Failed to delete document: ' + err.message);
    }
  };

  const handleUploadSuccess = (newDocs: DocumentMetadata[]) => {
    setDocuments(prev => [...newDocs, ...prev]);
  };

  const handleNewSession = () => {
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Header conforming to 3-zone contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewSession={handleNewSession}
      />

      {/* Prominent Prototype & Synthetic Demonstration Banner */}
      <div className="bg-slate-900 text-slate-200 text-xs px-4 py-2 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-emerald-400">RESEARCH PROTOTYPE</span>
            <span className="text-slate-500" aria-hidden="true">·</span>
            <span className="text-slate-300">Synthetic Oncology Demo Collection</span>
            <span className="text-slate-500" aria-hidden="true">·</span>
            <span className="text-amber-300 font-medium">Not Real Medical or Clinical Information</span>
          </div>
          <div className="text-slate-400 font-mono text-[10px]">
            {documents.length} Indexed Documents · Verified Citations
          </div>
        </div>
      </div>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {appError && (
          <div className="mb-4 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{appError}</span>
            </div>
            <button
              onClick={() => setAppError(null)}
              className="text-rose-600 hover:text-rose-800 font-medium text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* View Routing */}
        {activeTab === 'assistant' && (
          <ResearchAssistant
            documents={documents}
            onUploadClick={() => setIsUploadOpen(true)}
            onResetDemo={handleResetDemo}
            onOpenDocumentPreview={(id) => setPreviewDocId(id)}
            messages={messages}
            setMessages={setMessages}
          />
        )}

        {activeTab === 'library' && (
          <DocumentLibrary
            documents={documents}
            onUploadClick={() => setIsUploadOpen(true)}
            onResetDemo={handleResetDemo}
            onDeleteDocument={handleDeleteDocument}
            onPreviewDocument={(id) => setPreviewDocId(id)}
          />
        )}

        {activeTab === 'eval' && (
          <EvaluationLab initialTests={evaluationTests} />
        )}

        {activeTab === 'about' && (
          <AboutModal />
        )}

      </main>

      {/* Global Modals */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      <DocumentPreviewModal
        documentId={previewDocId}
        onClose={() => setPreviewDocId(null)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <div>
            <span className="font-semibold text-slate-700">PharmaSource AI</span> — Find the evidence. Understand the source.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Enterprise Commercial Intelligence</span>
            <span aria-hidden="true">·</span>
            <span>Single-User Prototype</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

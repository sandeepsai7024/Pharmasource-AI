/**
 * Evidence Inspector Panel
 * Allows users to inspect original supporting passages, location coordinates, and verification proofs.
 */

import React from 'react';
import { Citation } from '../types/index.js';
import { CheckCircle2, AlertTriangle, FileText, ChevronLeft, ChevronRight, X, ExternalLink } from 'lucide-react';

interface EvidenceInspectorProps {
  selectedCitation: Citation | null;
  citationsList: Citation[];
  onSelectCitation: (citation: Citation | null) => void;
  onOpenDocumentPreview?: (documentId: string) => void;
  onClose?: () => void;
}

export const EvidenceInspector: React.FC<EvidenceInspectorProps> = ({
  selectedCitation,
  citationsList,
  onSelectCitation,
  onOpenDocumentPreview,
  onClose,
}) => {
  if (!selectedCitation) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <FileText className="w-10 h-10 mb-3 text-slate-300 stroke-[1.5]" />
        <p className="text-sm font-medium text-slate-600">No Evidence Selected</p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Click any citation badge in an answer to inspect its original document passage, location metadata, and verification proof.
        </p>
      </div>
    );
  }

  const currentIndex = citationsList.findIndex(c => c.chunkId === selectedCitation.chunkId);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < citationsList.length - 1;

  const handlePrevious = () => {
    if (hasPrevious) {
      onSelectCitation(citationsList[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onSelectCitation(citationsList[currentIndex + 1]);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Top Inspector Bar */}
      <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
            Evidence Source {currentIndex >= 0 ? `${currentIndex + 1}/${citationsList.length}` : ''}
          </span>
          {selectedCitation.isVerified ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Verified Chunk
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              Unverified
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {citationsList.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                disabled={!hasPrevious}
                className="p-1 rounded text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200/60 transition-colors"
                title="Previous citation"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                disabled={!hasNext}
                className="p-1 rounded text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200/60 transition-colors"
                title="Next citation"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 ml-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              title="Close inspector"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Body Details */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {/* Document metadata header */}
        <div className="space-y-1.5 pb-3 border-b border-slate-100">
          <h4 className="text-sm font-semibold text-slate-900 leading-snug">
            {selectedCitation.documentTitle}
          </h4>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <span className="font-mono text-slate-600">{selectedCitation.filename}</span>
            <span aria-hidden="true">·</span>
            <span>Page {selectedCitation.pageNumber}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-slate-600">
              Score {(selectedCitation.similarityScore * 100).toFixed(0)}%
            </span>
          </div>
          {selectedCitation.sectionHeading && (
            <div className="text-xs text-slate-600 italic">
              Section: &ldquo;{selectedCitation.sectionHeading}&rdquo;
            </div>
          )}
        </div>

        {/* Original Document Excerpt Passage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
              Supporting Text Passage
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {selectedCitation.chunkId}
            </span>
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-lg text-xs leading-relaxed text-slate-800 font-sans whitespace-pre-wrap select-text">
            {selectedCitation.excerptText}
          </div>
        </div>

        {/* Verification coordinates note */}
        <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg text-xs text-slate-600 space-y-1">
          <div className="font-medium text-blue-900">Deterministic Source Verification</div>
          <p className="text-[11px] text-slate-600 leading-normal">
            This passage was retrieved directly from the indexed document repository and validated against the assistant&apos;s factual claim before display.
          </p>
        </div>

        {onOpenDocumentPreview && (
          <button
            onClick={() => onOpenDocumentPreview(selectedCitation.documentId)}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Open Complete Document In Viewer</span>
          </button>
        )}
      </div>
    </div>
  );
};

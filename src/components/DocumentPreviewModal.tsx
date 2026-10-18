/**
 * Document Previewer Modal
 * Displays indexed chunks, section titles, page coordinates, and raw parsed text.
 */

import React, { useEffect, useState } from 'react';
import { DocumentMetadata, DocumentChunk } from '../types/index.js';
import { fetchDocumentDetails } from '../services/api.js';
import { X, FileText, AlertTriangle, Layers, BookOpen, Loader2 } from 'lucide-react';

interface DocumentPreviewModalProps {
  documentId: string | null;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  documentId,
  onClose,
}) => {
  const [doc, setDoc] = useState<DocumentMetadata | null>(null);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    if (!documentId) return;
    setLoading(true);
    setError(null);
    fetchDocumentDetails(documentId)
      .then(data => {
        setDoc(data.document);
        setChunks(data.chunks);
      })
      .catch(err => {
        setError(err.message || 'Failed to load document details');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [documentId]);

  if (!documentId) return null;

  const filteredChunks = chunks.filter(c => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      c.text.toLowerCase().includes(q) ||
      c.sectionHeading.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 leading-snug">
                {doc?.title || 'Document Inspection'}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                <span>{doc?.filename}</span>
                <span aria-hidden="true">·</span>
                <span>{doc?.pageCount || 1} pages</span>
                <span aria-hidden="true">·</span>
                <span>{chunks.length} indexed chunks</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning banner if low-text */}
        {doc?.warning && (
          <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{doc.warning}</span>
          </div>
        )}

        {/* Search bar inside modal */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between gap-4">
          <input
            type="text"
            placeholder="Filter chunks by term or section..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full max-w-md px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
          />
          <div className="text-xs text-slate-400 font-mono whitespace-nowrap">
            Showing {filteredChunks.length} of {chunks.length} chunks
          </div>
        </div>

        {/* Content list */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs font-medium">Extracting indexed chunks...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {error}
            </div>
          ) : filteredChunks.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No chunks matched your filter &ldquo;{searchFilter}&rdquo;.
            </div>
          ) : (
            filteredChunks.map((chunk) => (
              <div
                key={chunk.id}
                className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] border border-blue-200/50">
                      {chunk.id}
                    </span>
                    <span className="text-slate-600 font-medium">
                      Page {chunk.pageNumber}
                    </span>
                    {chunk.sectionHeading && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-500 italic truncate max-w-xs">
                          {chunk.sectionHeading}
                        </span>
                      </>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {chunk.wordCount} words
                  </span>
                </div>

                <p className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap select-text">
                  {chunk.text}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

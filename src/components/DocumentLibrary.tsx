/**
 * Document Library View
 * Inventory of uploaded documents, chunk statistics, status indicators, and actions.
 */

import React, { useState } from 'react';
import { DocumentMetadata } from '../types/index.js';
import {
  FileText,
  Search,
  UploadCloud,
  RotateCcw,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Sparkles
} from 'lucide-react';

interface DocumentLibraryProps {
  documents: DocumentMetadata[];
  onUploadClick: () => void;
  onResetDemo: () => void;
  onDeleteDocument: (id: string) => void;
  onPreviewDocument: (id: string) => void;
}

export const DocumentLibrary: React.FC<DocumentLibraryProps> = ({
  documents,
  onUploadClick,
  onResetDemo,
  onDeleteDocument,
  onPreviewDocument,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredDocs = documents.filter(doc => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(q) ||
      doc.filename.toLowerCase().includes(q) ||
      doc.id.toLowerCase().includes(q)
    );
  });

  const totalChunks = documents.reduce((sum, d) => sum + d.chunkCount, 0);
  const totalPages = documents.reduce((sum, d) => sum + d.pageCount, 0);

  const handleConfirmDelete = (id: string) => {
    onDeleteDocument(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Notice */}
      <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-950">
              Trusted Research Repository
            </h4>
            <p className="text-xs text-blue-800/80 mt-0.5">
              PharmaSource AI searches strictly within indexed documents in this workspace. Fictional demo documents are explicitly tagged as synthetic.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onResetDemo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
            title="Restore default synthetic oncology commercial dataset"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Restore Synthetic Demo</span>
          </button>
          <button
            onClick={onUploadClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Control Bar & Statistics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search document titles or filenames..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs"
          />
        </div>

        {/* Global Stats */}
        <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
          <span>{documents.length} Documents</span>
          <span aria-hidden="true">·</span>
          <span>{totalPages} Pages</span>
          <span aria-hidden="true">·</span>
          <span>{totalChunks} Indexed Chunks</span>
        </div>
      </div>

      {/* Document Inventory Table / Cards */}
      {filteredDocs.length === 0 ? (
        <div className="p-12 text-center bg-white border border-dashed border-slate-300 rounded-xl space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto stroke-[1.5]" />
          <div className="text-sm font-semibold text-slate-700">No Documents Found</div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? `No document titles matched "${searchQuery}". Clear your search or upload new files.`
              : 'Your workspace library is empty. Upload research documents or restore the synthetic oncology demo collection.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              onClick={onResetDemo}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Load Synthetic Demo
            </button>
            <button
              onClick={onUploadClick}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Upload Document
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider font-mono">
                  <th className="py-3 px-4">Document Title & Filename</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Pages / Chunks</th>
                  <th className="py-3 px-4">Upload Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="flex items-start gap-2.5">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-900 leading-snug">
                            {doc.title}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                            <span>{doc.filename}</span>
                            <span aria-hidden="true">·</span>
                            <span>{(doc.fileSize / 1024).toFixed(0)} KB</span>
                            {doc.isDemo && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-amber-700 font-sans font-medium">
                                  Synthetic Demo
                                </span>
                              </>
                            )}
                          </div>
                          {doc.warning && (
                            <div className="flex items-center gap-1 text-[11px] text-amber-700 font-medium">
                              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>{doc.warning}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono uppercase text-slate-600">
                      {doc.fileType}
                    </td>

                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700">
                      <div>{doc.pageCount} {doc.pageCount === 1 ? 'page' : 'pages'}</div>
                      <div className="text-[11px] text-slate-400">{doc.chunkCount} chunks</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap font-mono tabular-nums text-[11px]">
                      {new Date(doc.uploadDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="py-3.5 px-4">
                      {doc.status === 'ready' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Ready
                        </span>
                      ) : doc.status === 'warning_low_text' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Low Text
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-600">
                          {doc.status}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => onPreviewDocument(doc.id)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Inspect extracted chunks and metadata"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Delete document and remove indexed chunks"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Delete Document?
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  This will remove the document and all associated passage chunks from the hybrid retrieval index.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmDelete(deleteConfirmId)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

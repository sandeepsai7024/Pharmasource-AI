/**
 * Document Upload Modal
 * Supports drag-and-drop, multi-file uploads (PDF, DOCX, TXT, MD), validation and progress.
 */

import React, { useState, useRef } from 'react';
import { UploadCloud, X, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { uploadDocuments } from '../services/api.js';
import { DocumentMetadata } from '../types/index.js';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newDocs: DocumentMetadata[]) => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setError(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const validExtensions = ['pdf', 'docx', 'txt', 'md', 'markdown'];
    const validFiles: File[] = [];

    for (const f of files) {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      if (!validExtensions.includes(ext)) {
        setError(`"${f.name}" is not a supported file type. Allowed: PDF, DOCX, TXT, Markdown.`);
        return;
      }
      if (f.size > 25 * 1024 * 1024) {
        setError(`"${f.name}" (${(f.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 25 MB limit.`);
        return;
      }
      validFiles.push(f);
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setError(null);

    try {
      const result = await uploadDocuments(selectedFiles);
      if (result.errors && result.errors.length > 0) {
        const errMsgs = result.errors.map(e => `${e.filename}: ${e.error}`).join('; ');
        setError(`Some files failed: ${errMsgs}`);
      }
      if (result.ingested && result.ingested.length > 0) {
        onSuccess(result.ingested);
        setSelectedFiles([]);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 leading-snug">
                Upload Public Research Documents
              </h3>
              <p className="text-xs text-slate-500">
                Supported formats: PDF, DOCX, TXT, Markdown (Max 25 MB per file)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.txt,.md,.markdown"
              onChange={handleFileInput}
              className="hidden"
            />
            <UploadCloud className="w-10 h-10 mx-auto mb-3 text-slate-400 stroke-[1.5]" />
            <p className="text-sm font-medium text-slate-800">
              Drag & drop document files here, or <span className="text-blue-600 underline">browse</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Clinical study reports, commercial forecasts, product monographs, or competitive intelligence.
            </p>
          </div>

          {/* Selected File list */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
                Selected Files ({selectedFiles.length})
              </span>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-medium text-slate-800 truncate">{file.name}</span>
                      <span className="text-slate-400 font-mono tabular-nums shrink-0">
                        ({(file.size / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                      disabled={uploading}
                      className="p-1 text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Responsible research notice */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 space-y-1">
            <p className="font-medium text-slate-700">Notice on Untrusted Document Extraction:</p>
            <p className="text-[11px] leading-relaxed">
              Files are parsed and chunked locally in server memory. Do not upload confidential patient health records (PHI) or secret company keys. Documents with scanned images require OCR for readable extraction.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading || selectedFiles.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Ingesting & Chunking...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ingest {selectedFiles.length} {selectedFiles.length === 1 ? 'Document' : 'Documents'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

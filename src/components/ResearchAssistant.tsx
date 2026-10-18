/**
 * Research Assistant View - 3-Panel Enterprise Workspace
 * Left: Document Collection & Source Filter
 * Center: Conversational Question & Structured Grounded Answer
 * Right: Evidence Sources & Verified Excerpt Inspector
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  DocumentMetadata,
  ChatMessage,
  AnswerPayload,
  Citation,
  EvidenceStrength
} from '../types/index.js';
import { submitResearchQuery } from '../services/api.js';
import { EvidenceInspector } from './EvidenceInspector.js';
import {
  Send,
  Loader2,
  FileText,
  Search,
  CheckSquare,
  Square,
  Sparkles,
  Copy,
  Check,
  Download,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  Layers,
  RotateCcw
} from 'lucide-react';

interface ResearchAssistantProps {
  documents: DocumentMetadata[];
  onUploadClick: () => void;
  onResetDemo: () => void;
  onOpenDocumentPreview: (docId: string) => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export const ResearchAssistant: React.FC<ResearchAssistantProps> = ({
  documents,
  onUploadClick,
  onResetDemo,
  onOpenDocumentPreview,
  messages,
  setMessages,
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [docFilterQuery, setDocFilterQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [activeCitationsList, setActiveCitationsList] = useState<Citation[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize selected docs to all documents when loaded
  useEffect(() => {
    if (documents.length > 0 && selectedDocIds.length === 0) {
      setSelectedDocIds(documents.map(d => d.id));
    }
  }, [documents]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const toggleDocSelection = (id: string) => {
    setSelectedDocIds(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const selectAllDocs = () => {
    setSelectedDocIds(documents.map(d => d.id));
  };

  const deselectAllDocs = () => {
    setSelectedDocIds([]);
  };

  const handleSend = async (questionText?: string) => {
    const q = (questionText || inputQuery).trim();
    if (!q || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: q,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const answerPayload = await submitResearchQuery(
        q,
        selectedDocIds.length > 0 ? selectedDocIds : undefined
      );

      const assistantMessage: ChatMessage = {
        id: `msg-resp-${Date.now()}`,
        role: 'assistant',
        content: answerPayload.directAnswer,
        answerPayload,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (answerPayload.citations && answerPayload.citations.length > 0) {
        setActiveCitationsList(answerPayload.citations);
        setSelectedCitation(answerPayload.citations[0]);
        setRightPanelOpen(true);
      }
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: `Failed to synthesize evidence: ${err.message || 'Server error'}`,
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAnswer = (msg: ChatMessage) => {
    if (!msg.answerPayload) {
      navigator.clipboard.writeText(msg.content);
      setCopiedMessageId(msg.id);
      setTimeout(() => setCopiedMessageId(null), 2000);
      return;
    }

    const payload = msg.answerPayload;
    const textToCopy = `QUESTION: ${payload.query}

DIRECT ANSWER:
${payload.directAnswer}

KEY FINDINGS:
${payload.keyFindings.map(f => `- ${f.claim} [${f.citationIds.join(', ')}]`).join('\n')}

EVIDENCE STRENGTH: ${payload.evidenceStrength}

LIMITATIONS:
${payload.limitations}

CITATIONS:
${payload.citations.map(c => `[${c.chunkId}] ${c.documentTitle} (p. ${c.pageNumber}, ${c.sectionHeading})\n"${c.excerptText}"`).join('\n\n')}
`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedMessageId(msg.id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleExportNote = (msg: ChatMessage) => {
    if (!msg.answerPayload) return;
    const payload = msg.answerPayload;

    const markdown = `# PharmaSource AI Research Note
Generated: ${new Date(payload.timestamp).toLocaleString()}

## Research Query
> ${payload.query}

## Direct Answer
${payload.directAnswer}

## Evidence Strength
**${payload.evidenceStrength}** (Sources searched: ${payload.sourcesSearchedCount}, Retrieved passages: ${payload.passagesRetrievedCount})

## Key Findings
${payload.keyFindings.map(f => `- ${f.claim} *(Citations: ${f.citationIds.join(', ')})*`).join('\n')}

## Document Limitations & Caveats
${payload.limitations}

## Supporting Evidence Excerpts
${payload.citations.map(c => `### ${c.documentTitle} (${c.filename})
- **Location:** Page ${c.pageNumber}, Section: "${c.sectionHeading}"
- **Chunk ID:** \`${c.chunkId}\`
- **Retrieval Match Score:** ${(c.similarityScore * 100).toFixed(0)}%
- **Status:** Verified

> "${c.excerptText}"
`).join('\n')}

***
*Notice: PharmaSource AI is an enterprise document research assistant. Not for medical diagnosis or clinical treatment.*
`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pharmasource-note-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const suggestedPrompts = [
    {
      label: 'DESTINY-ZEN PFS & HR',
      query: 'What was the median progression-free survival (mPFS) and hazard ratio for Zeltaximab in the DESTINY-ZEN Phase 3 trial?',
    },
    {
      label: 'Peak Sales & US Price',
      query: 'What is the projected peak global sales for Zeltaximab and what is the modeled US WAC list price per cycle?',
    },
    {
      label: 'Conflicting Trodelvy Share',
      query: "What was Sacituzumab govitecan's market share in second-line metastatic TNBC in 2024?",
    },
    {
      label: 'Cardiotoxicity in Pancreatic',
      query: 'What was the incidence of cardiotoxicity in the Phase 2 pancreatic cancer trial for Zeltaximab?',
    },
    {
      label: 'Patient Dosing Advice (Out-of-Scope)',
      query: 'I am a 52-year-old breast cancer patient. What dose of Zeltaximab should I take and should I switch today?',
    },
  ];

  const filteredDocs = documents.filter(d =>
    d.title.toLowerCase().includes(docFilterQuery.toLowerCase()) ||
    d.filename.toLowerCase().includes(docFilterQuery.toLowerCase())
  );

  const getEvidenceStrengthBadge = (strength: EvidenceStrength) => {
    switch (strength) {
      case 'Supported':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Supported by Evidence
          </span>
        );
      case 'Partially Supported':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            Partially Supported
          </span>
        );
      case 'Conflicting Evidence':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
            Conflicting Sources
          </span>
        );
      case 'Insufficient Evidence':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
            Insufficient Evidence
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8.5rem)] min-h-[580px]">
      
      {/* ========================================================= */}
      {/* LEFT PANEL: Document Collection & Source Filter          */}
      {/* ========================================================= */}
      <div className="w-full lg:w-72 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden shadow-xs shrink-0">
        
        {/* Panel Header */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider font-mono">
              Active Source Filters
            </span>
            <span className="text-[11px] font-mono tabular-nums text-slate-500">
              {selectedDocIds.length}/{documents.length} Selected
            </span>
          </div>

          {/* Quick Filter Search */}
          <div className="relative mt-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Filter documents..."
              value={docFilterQuery}
              onChange={(e) => setDocFilterQuery(e.target.value)}
              className="w-full pl-8 pr-2 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between mt-2 text-[11px]">
            <button
              onClick={selectAllDocs}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Select All
            </button>
            <button
              onClick={deselectAllDocs}
              className="text-slate-500 hover:text-slate-700"
            >
              Clear Filter
            </button>
          </div>
        </div>

        {/* Document Checklist */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredDocs.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No matching documents.
            </div>
          ) : (
            filteredDocs.map(doc => {
              const isSelected = selectedDocIds.includes(doc.id);
              return (
                <div
                  key={doc.id}
                  onClick={() => toggleDocSelection(doc.id)}
                  className={`p-2 rounded-lg cursor-pointer transition-colors text-xs flex items-start gap-2 ${
                    isSelected ? 'bg-blue-50/60 border border-blue-200/50' : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="mt-0.5 text-blue-600 shrink-0">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 fill-blue-600 text-white" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 truncate leading-snug">
                      {doc.title}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                      <span>{doc.pageCount}p</span>
                      <span aria-hidden="true">·</span>
                      <span>{doc.chunkCount} chunks</span>
                      {doc.isDemo && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-700 font-sans">Demo</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Panel Footer Actions */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/70 space-y-2">
          <button
            onClick={onUploadClick}
            className="w-full py-1.5 px-3 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200/60 transition-colors"
          >
            + Upload New Document
          </button>
          <button
            onClick={onResetDemo}
            className="w-full py-1 px-2 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center justify-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Synthetic Demo</span>
          </button>
        </div>

      </div>

      {/* ========================================================= */}
      {/* CENTER PANEL: Natural Language Chat & Structured Answers  */}
      {/* ========================================================= */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden shadow-xs min-w-0">
        
        {/* Research Stream Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center max-w-xl mx-auto py-8 space-y-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <FileText className="w-8 h-8 stroke-[1.5]" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-900">
                  Welcome to PharmaSource AI
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Query the indexed oncology commercial documents below. Answers are strictly bound to retrieved passages with verifiable citation coordinates and automatic abstention.
                </p>
              </div>

              {/* Benchmark Inquiry Cards */}
              <div className="w-full text-left space-y-2 pt-2">
                <span className="text-[11px] font-semibold text-slate-600 uppercase font-mono">
                  Sample Research Questions:
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {suggestedPrompts.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(item.query)}
                      className="p-2.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-200 rounded-lg text-left transition-colors group"
                    >
                      <div className="text-[11px] font-semibold text-blue-600 font-mono">
                        {item.label}
                      </div>
                      <div className="text-xs text-slate-700 mt-0.5 group-hover:text-slate-900">
                        {item.query}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="space-y-3">
                {msg.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="max-w-2xl bg-blue-600 text-white rounded-2xl rounded-tr-xs px-4 py-3 text-xs leading-relaxed shadow-xs">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div className="max-w-3xl bg-slate-50/80 border border-slate-200 rounded-2xl rounded-tl-xs p-4 sm:p-5 space-y-4 shadow-xs">
                    
                    {/* Header Row: Evidence Strength & Retrieval Metrics */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        {msg.answerPayload?.evidenceStrength &&
                          getEvidenceStrengthBadge(msg.answerPayload.evidenceStrength)}
                      </div>

                      {msg.answerPayload && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                          <span>Searched: {msg.answerPayload.sourcesSearchedCount} docs</span>
                          <span aria-hidden="true">·</span>
                          <span>Evaluated: {msg.answerPayload.passagesRetrievedCount} passages</span>
                        </div>
                      )}
                    </div>

                    {/* Section A: Direct Answer */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
                        Direct Answer
                      </span>
                      <p className="text-xs text-slate-900 leading-relaxed font-sans font-medium select-text">
                        {msg.answerPayload ? msg.answerPayload.directAnswer : msg.content}
                      </p>
                    </div>

                    {/* Section B: Key Findings with Citations */}
                    {msg.answerPayload && msg.answerPayload.keyFindings.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
                          Key Evidence Findings
                        </span>
                        <ul className="space-y-2 text-xs text-slate-800">
                          {msg.answerPayload.keyFindings.map((finding, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              <div className="flex-1 leading-relaxed">
                                <span className="select-text">{finding.claim}</span>
                                {finding.citationIds && finding.citationIds.length > 0 && (
                                  <span className="ml-2 inline-flex flex-wrap gap-1">
                                    {finding.citationIds.map(cid => {
                                      const citationObj = msg.answerPayload?.citations.find(c => c.chunkId === cid);
                                      return (
                                        <button
                                          key={cid}
                                          onClick={() => {
                                            if (citationObj) {
                                              setSelectedCitation(citationObj);
                                              setActiveCitationsList(msg.answerPayload!.citations);
                                              setRightPanelOpen(true);
                                            }
                                          }}
                                          className="font-mono text-[10px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                          title={`Inspect verified excerpt: ${citationObj?.documentTitle || cid}`}
                                        >
                                          [{citationObj ? `p. ${citationObj.pageNumber}` : cid}]
                                        </button>
                                      );
                                    })}
                                  </span>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Section E: Document Limitations */}
                    {msg.answerPayload?.limitations && (
                      <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-lg text-xs text-amber-900 space-y-0.5">
                        <div className="font-semibold text-[11px] font-mono uppercase text-amber-800">
                          Document Caveats & Limitations
                        </div>
                        <p className="text-[11px] text-amber-900 leading-normal">
                          {msg.answerPayload.limitations}
                        </p>
                      </div>
                    )}

                    {/* Validation Warnings if any */}
                    {msg.answerPayload?.validationWarnings && msg.answerPayload.validationWarnings.length > 0 && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
                        <div className="font-semibold text-[11px] font-mono uppercase text-rose-700">
                          Citation Validation Alert:
                        </div>
                        {msg.answerPayload.validationWarnings.map((w, i) => (
                          <p key={i} className="text-[11px] text-rose-700">
                            • {w}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Section C: Citation Chips Row */}
                    {msg.answerPayload && msg.answerPayload.citations.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase font-mono">
                            Supporting Passages ({msg.answerPayload.citations.length})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {msg.answerPayload.citations.map((c, i) => (
                            <button
                              key={c.chunkId}
                              onClick={() => {
                                setSelectedCitation(c);
                                setActiveCitationsList(msg.answerPayload!.citations);
                                setRightPanelOpen(true);
                              }}
                              className={`p-2 rounded-lg text-left text-xs border transition-colors flex items-center gap-2 ${
                                selectedCitation?.chunkId === c.chunkId
                                  ? 'bg-blue-50 border-blue-300 text-blue-900 ring-1 ring-blue-400'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <div className="truncate max-w-[200px]">
                                <div className="font-medium truncate text-[11px]">{c.documentTitle}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  Page {c.pageNumber} · Match {(c.similarityScore * 100).toFixed(0)}%
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Toolbar Actions: Copy, Export */}
                    {msg.answerPayload && (
                      <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleCopyAnswer(msg)}
                            className="inline-flex items-center gap-1.5 hover:text-slate-800 transition-colors"
                          >
                            {copiedMessageId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 font-medium">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Answer</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleExportNote(msg)}
                            className="inline-flex items-center gap-1.5 hover:text-slate-800 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export Research Note (.md)</span>
                          </button>
                        </div>

                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}

                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 max-w-md">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Searching hybrid vector index and validating citations...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Query Input Box */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask a factual question about the selected documents (e.g., DESTINY-ZEN PFS, peak sales, dosing)..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
            <span>Searching {selectedDocIds.length} active documents</span>
            <span>Research & Document Navigation Only</span>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* RIGHT PANEL: Evidence Inspector & Supporting Excerpts    */}
      {/* ========================================================= */}
      <div className={`w-full lg:w-80 shrink-0 ${rightPanelOpen ? 'block' : 'hidden lg:block'}`}>
        <EvidenceInspector
          selectedCitation={selectedCitation}
          citationsList={activeCitationsList}
          onSelectCitation={(c) => setSelectedCitation(c)}
          onOpenDocumentPreview={onOpenDocumentPreview}
        />
      </div>

    </div>
  );
};

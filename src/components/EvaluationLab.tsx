/**
 * Evaluation Lab View
 * Automated benchmark runner executing the 7 pharmaceutical research AI validation categories.
 */

import React, { useState } from 'react';
import { EvaluationTestResult, EvaluationSummary, EvaluationTestCase } from '../types/index.js';
import { runEvaluationSuite } from '../services/api.js';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Sliders,
  Filter
} from 'lucide-react';

interface EvaluationLabProps {
  initialTests: EvaluationTestCase[];
}

export const EvaluationLab: React.FC<EvaluationLabProps> = ({ initialTests }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<EvaluationTestResult[]>([]);
  const [summary, setSummary] = useState<EvaluationSummary | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunAll = async (categoryFilter?: string) => {
    setIsRunning(true);
    setError(null);
    try {
      let testIds: string[] | undefined = undefined;
      if (categoryFilter && categoryFilter !== 'all') {
        testIds = initialTests.filter(t => t.category === categoryFilter).map(t => t.id);
      }
      const data = await runEvaluationSuite(testIds);
      setResults(data.results);
      setSummary(data.summary);
      if (data.results.length > 0) {
        setExpandedTestId(data.results[0].testId);
      }
    } catch (err: any) {
      setError(err.message || 'Benchmark execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All Benchmarks' },
    { id: 'answerable', label: 'Answerable' },
    { id: 'partially_answerable', label: 'Partial' },
    { id: 'unanswerable', label: 'Unanswerable / Abstention' },
    { id: 'conflicting_evidence', label: 'Conflicting Data' },
    { id: 'citation_validity', label: 'Citation Checks' },
    { id: 'prompt_injection', label: 'Prompt Injection' },
    { id: 'out_of_scope_clinical', label: 'Clinical Refusal' },
  ];

  const displayedResults = results.filter(r => {
    if (selectedCategory === 'all') return true;
    return r.category === selectedCategory;
  });

  return (
    <div className="space-y-6">

      {/* Top Banner Notice */}
      <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-semibold">Evaluation Lab & Invariant Benchmarks</h3>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Systematically tests grounded retrieval, citation verification, prompt injection resistance, conflict detection, and medical out-of-scope abstention against the current document collection.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleRunAll(selectedCategory)}
            disabled={isRunning}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Executing Benchmark...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run {selectedCategory === 'all' ? 'All 16' : ''} Benchmark Tests</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Scorecards Row */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-4 bg-white border border-slate-200 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-500 uppercase font-mono">Tests Run</span>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {summary.totalExecuted}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {summary.passedCount} passed / {summary.failedCount} failed
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-500 uppercase font-mono">Overall Pass Rate</span>
            <div className="text-2xl font-bold font-mono tabular-nums text-blue-600 mt-1">
              {summary.passRate}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Across all categories
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-500 uppercase font-mono">Citation Validity</span>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 mt-1">
              {summary.citationValidityRate}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Verified source chunk IDs
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-500 uppercase font-mono">Abstention Precision</span>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {summary.correctAbstentionRate}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Unanswerable questions
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl col-span-2 md:col-span-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase font-mono">Unsupported Claims</span>
            <div className="text-2xl font-bold font-mono tabular-nums text-rose-600 mt-1">
              {summary.unsupportedAnswerRate}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Hallucination metric
            </div>
          </div>
        </div>
      )}

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Test List Section */}
      {results.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl space-y-3">
          <FileCheck className="w-12 h-12 text-slate-300 mx-auto stroke-[1.5]" />
          <h4 className="text-sm font-semibold text-slate-800">Benchmark Suite Ready</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click &ldquo;Run Benchmark Tests&rdquo; above to execute automated evaluations across factual answerability, unanswerable questions, conflicting documents, prompt injection defense, and citation verification.
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleRunAll('all')}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Start Automated Benchmark</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedResults.map((result) => {
            const isExpanded = expandedTestId === result.testId;
            return (
              <div
                key={result.testId}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 transition-colors"
              >
                {/* Collapsed Header */}
                <div
                  onClick={() => setExpandedTestId(isExpanded ? null : result.testId)}
                  className="px-5 py-3.5 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50/60"
                >
                  <div className="flex items-start gap-3">
                    {result.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[11px] font-semibold text-slate-500 uppercase">
                          {result.category.replace(/_/g, ' ')}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                          result.passed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {result.passed ? 'PASSED' : 'FAILED'}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="text-[11px] font-mono tabular-nums text-slate-500">
                          {result.executionTimeMs}ms
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-900 leading-snug">
                        {result.question}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono text-slate-500 hidden sm:inline">
                      {result.actualEvidenceStrength}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-slate-100 bg-slate-50/40 space-y-3.5 text-xs">
                    
                    {/* Expected Behavior */}
                    <div>
                      <span className="font-semibold text-slate-700 uppercase font-mono text-[11px]">
                        Expected Invariant
                      </span>
                      <p className="text-slate-600 mt-0.5">
                        {result.expectedBehavior}
                      </p>
                    </div>

                    {/* Actual Response */}
                    <div>
                      <span className="font-semibold text-slate-700 uppercase font-mono text-[11px]">
                        Actual Generated Direct Answer
                      </span>
                      <div className="p-3 bg-white border border-slate-200 rounded-lg text-slate-800 mt-1 select-text">
                        {result.actualDirectAnswer}
                      </div>
                    </div>

                    {/* Diagnostic evaluation notes */}
                    <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg text-slate-700 text-xs">
                      <span className="font-medium text-blue-900">Diagnostic Verdict: </span>
                      <span>{result.notes}</span>
                    </div>

                    {/* Citations validated */}
                    {result.answerPayload && result.answerPayload.citations.length > 0 && (
                      <div>
                        <span className="font-semibold text-slate-700 uppercase font-mono text-[11px]">
                          Verified Source Citations ({result.answerPayload.citations.length})
                        </span>
                        <div className="space-y-1.5 mt-1">
                          {result.answerPayload.citations.map((c, i) => (
                            <div key={i} className="p-2 bg-white border border-slate-200 rounded text-xs">
                              <div className="font-medium text-slate-900">{c.documentTitle}</div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {c.filename} · Page {c.pageNumber} · Chunk {c.chunkId}
                              </div>
                              <p className="text-[11px] text-slate-700 mt-1 italic line-clamp-2">
                                &ldquo;{c.excerptText}&rdquo;
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Regulatory Prototype Disclaimer */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 space-y-1">
        <div className="font-semibold text-slate-700">Prototype Evaluation Governance Notice:</div>
        <p className="text-[11px] leading-relaxed">
          These automated benchmark metrics assess retrieval fidelity, citation validation accuracy, and rule compliance within this demonstration environment. They do not constitute formal clinical safety validation or medical device certification.
        </p>
      </div>

    </div>
  );
};

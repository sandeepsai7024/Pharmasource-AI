/**
 * Top Navigation Bar adhering strictly to the Top Bar Contract
 */

import React from 'react';
import { Plus } from 'lucide-react';

interface HeaderProps {
  activeTab: 'assistant' | 'library' | 'eval' | 'about';
  setActiveTab: (tab: 'assistant' | 'library' | 'eval' | 'about') => void;
  onNewSession: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onNewSession,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          
          {/* Zone 1: Single Text Element Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xl font-bold tracking-tight text-slate-900 font-sans whitespace-nowrap">
              PharmaSource AI
            </span>
          </div>

          {/* Zone 2: 4 Clean Single-Line Text Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => setActiveTab('assistant')}
              className={`pb-1 transition-colors whitespace-nowrap shrink-0 border-b-2 text-sm font-medium ${
                activeTab === 'assistant'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Research Assistant
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`pb-1 transition-colors whitespace-nowrap shrink-0 border-b-2 text-sm font-medium ${
                activeTab === 'library'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Document Library
            </button>
            <button
              onClick={() => setActiveTab('eval')}
              className={`pb-1 transition-colors whitespace-nowrap shrink-0 border-b-2 text-sm font-medium ${
                activeTab === 'eval'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Evaluation Lab
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`pb-1 transition-colors whitespace-nowrap shrink-0 border-b-2 text-sm font-medium ${
                activeTab === 'about'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              About & Limitations
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onNewSession}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shadow-sm"
              title="Clear current conversational questions without deleting documents"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Session</span>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Nav Drawer Row */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-100 py-2 px-2 bg-slate-50/80">
        <button
          onClick={() => setActiveTab('assistant')}
          className={`px-2 py-1 text-xs font-medium ${activeTab === 'assistant' ? 'text-blue-600 font-semibold' : 'text-slate-600'}`}
        >
          Assistant
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`px-2 py-1 text-xs font-medium ${activeTab === 'library' ? 'text-blue-600 font-semibold' : 'text-slate-600'}`}
        >
          Library
        </button>
        <button
          onClick={() => setActiveTab('eval')}
          className={`px-2 py-1 text-xs font-medium ${activeTab === 'eval' ? 'text-blue-600 font-semibold' : 'text-slate-600'}`}
        >
          Evaluation
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`px-2 py-1 text-xs font-medium ${activeTab === 'about' ? 'text-blue-600 font-semibold' : 'text-slate-600'}`}
        >
          About
        </button>
      </div>
    </header>
  );
};

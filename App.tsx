import React, { useState } from 'react';
import { generateWorkflow } from './services/aiService';
import { WorkflowResult, LLMProvider } from './types';
import WorkflowVisualizer from './components/WorkflowVisualizer';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import {
  Layout,
  Sparkles,
  Code2,
  Play,
  Loader2,
  AlertCircle,
  ClipboardCopy,
  Check,
  Cpu
} from 'lucide-react';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [provider, setProvider] = useState<LLMProvider>('openai');
  const [workflow, setWorkflow] = useState<WorkflowResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'visual' | 'json' | 'analytics'>('visual');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setWorkflow(null);

    try {
      const result = await generateWorkflow(prompt, provider);
      setWorkflow(result);
      setActiveTab('visual');
    } catch (err) {
      setError("Failed to generate workflow. Please try again with a more specific use case.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (workflow) {
      navigator.clipboard.writeText(JSON.stringify(workflow, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Layout className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Orchestrator AI
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors hidden sm:block"
            >
              Documentation
            </a>
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
              PM
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Input Section */}
        <section className="max-w-3xl mx-auto mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Architect Your Workflow</h2>
            <p className="text-lg text-slate-600">
              Describe a business goal, and our AI will orchestrate a technical, agent-based execution plan.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="relative">
            <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100/50 p-2 border border-slate-200 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100 transition-all">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., Automate a competitive analysis pipeline that scrapes pricing pages, stores data in Snowflake, and generates a PDF report..."
                className="w-full h-32 p-4 bg-transparent border-none focus:ring-0 text-lg resize-none placeholder:text-slate-300"
              />
              <div className="flex justify-between items-center px-4 pb-2">
                <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                  <Cpu className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-500">Engine:</span>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as LLMProvider)}
                    className="text-xs font-semibold text-indigo-600 bg-transparent border-none rounded focus:ring-0 cursor-pointer outline-none"
                  >
                    <option value="openai">GPT-4o</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white transition-all transform hover:scale-105 active:scale-95 ${loading || !prompt.trim()
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                    }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Architecting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Workflow
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </section>

        {/* Results Section */}
        {workflow && (
          <section className="animate-fade-in-up">
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="bg-slate-100 p-1 rounded-lg inline-flex">
                <button
                  onClick={() => setActiveTab('visual')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'visual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <Layout className="w-4 h-4" />
                    Visual Flow
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'analytics' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 rotate-90" />
                    Analytics
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('json')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'json' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4" />
                    JSON Output
                  </div>
                </button>
              </div>
            </div>

            <div className="transition-all duration-300">
              {activeTab === 'visual' && <WorkflowVisualizer data={workflow} />}

              {activeTab === 'analytics' && <AnalyticsDashboard data={workflow} />}

              {activeTab === 'json' && (
                <div className="max-w-4xl mx-auto">
                  <div className="bg-[#1e293b] rounded-xl overflow-hidden shadow-2xl">
                    <div className="flex items-center justify-between px-4 py-3 bg-[#0f172a] border-b border-slate-700">
                      <span className="text-xs font-mono text-slate-400">workflow.json</span>
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied' : 'Copy JSON'}
                      </button>
                    </div>
                    <pre className="p-6 overflow-x-auto custom-scrollbar">
                      <code className="font-mono text-sm text-blue-300">
                        {JSON.stringify(workflow, null, 2)}
                      </code>
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default App;
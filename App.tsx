import React, { useState } from 'react';
import { generateWorkflow } from './services/aiService';
import { WorkflowResult, LLMProvider, WorkflowStep } from './types';
import WorkflowVisualizer from './components/WorkflowVisualizer';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { StepEditor } from './components/StepEditor';
import { TemplateLibrary } from './components/TemplateLibrary';
import { saveTemplate } from './services/templateService';
import {
  Layout,
  Sparkles,
  Code2,
  Play,
  Loader2,
  AlertCircle,
  ClipboardCopy,
  Check,
  Cpu,
  Edit3,
  Save,
  FileText,
  X
} from 'lucide-react';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [provider, setProvider] = useState<LLMProvider>('openai');
  const [workflow, setWorkflow] = useState<WorkflowResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'visual' | 'json' | 'analytics'>('visual');
  const [copied, setCopied] = useState(false);

  // Edit mode states
  const [editMode, setEditMode] = useState(false);
  const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null);
  const [isStepEditorOpen, setIsStepEditorOpen] = useState(false);
  const [isNewStep, setIsNewStep] = useState(false);
  const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] = useState(false);
  const [saveTemplateModalOpen, setSaveTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setWorkflow(null);
    setEditMode(false);

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

  const handleEditStep = (step: WorkflowStep) => {
    setEditingStep(step);
    setIsNewStep(false);
    setIsStepEditorOpen(true);
  };

  const handleAddStep = () => {
    const newStepId = workflow ? Math.max(...workflow.steps.map(s => s.step_id)) + 1 : 1;
    setEditingStep({
      step_id: newStepId,
      agent_type: 'Content',
      agent_ids: [],
      action_description: '',
      timing_logic: 'Manual',
      input_config: { source: 'PM_Input', type: 'Raw_Text' },
      output_storage: ''
    });
    setIsNewStep(true);
    setIsStepEditorOpen(true);
  };

  const handleSaveStep = (step: WorkflowStep) => {
    if (!workflow) return;

    if (isNewStep) {
      // Add new step
      setWorkflow({
        ...workflow,
        steps: [...workflow.steps, step].sort((a, b) => a.step_id - b.step_id)
      });
    } else {
      // Update existing step
      setWorkflow({
        ...workflow,
        steps: workflow.steps.map(s => s.step_id === step.step_id ? step : s)
      });
    }
  };

  const handleDeleteStep = (stepId: number) => {
    if (!workflow) return;

    const updatedSteps = workflow.steps
      .filter(s => s.step_id !== stepId)
      .map((s, index) => ({ ...s, step_id: index + 1 })); // Reorder step IDs

    setWorkflow({
      ...workflow,
      steps: updatedSteps
    });
  };

  const handleSaveTemplate = () => {
    if (!workflow || !templateName.trim()) return;

    saveTemplate(workflow, templateName, templateDescription);
    setSaveTemplateModalOpen(false);
    setTemplateName('');
    setTemplateDescription('');
    alert('Template saved successfully!');
  };

  const handleLoadTemplate = (loadedWorkflow: WorkflowResult) => {
    setWorkflow(loadedWorkflow);
    setActiveTab('visual');
    setEditMode(false);
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
            {workflow && (
              <>
                <button
                  onClick={() => setIsTemplateLibraryOpen(true)}
                  className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Templates
                </button>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`text-sm font-medium transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg ${editMode
                      ? 'bg-amber-100 text-amber-700'
                      : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'
                    }`}
                >
                  {editMode ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  {editMode ? 'Exit Edit' : 'Edit Mode'}
                </button>
                {editMode && (
                  <button
                    onClick={() => setSaveTemplateModalOpen(true)}
                    className="text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save as Template
                  </button>
                )}
              </>
            )}
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
              {activeTab === 'visual' && (
                <WorkflowVisualizer
                  data={workflow}
                  editMode={editMode}
                  onEditStep={handleEditStep}
                  onDeleteStep={handleDeleteStep}
                  onAddStep={handleAddStep}
                />
              )}

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

      {/* Step Editor Modal */}
      <StepEditor
        step={editingStep}
        isOpen={isStepEditorOpen}
        onClose={() => {
          setIsStepEditorOpen(false);
          setEditingStep(null);
        }}
        onSave={handleSaveStep}
        isNewStep={isNewStep}
      />

      {/* Template Library Modal */}
      <TemplateLibrary
        isOpen={isTemplateLibraryOpen}
        onClose={() => setIsTemplateLibraryOpen(false)}
        onLoadTemplate={handleLoadTemplate}
      />

      {/* Save Template Modal */}
      {saveTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Save as Template</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Newsletter Campaign Workflow"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Brief description of this workflow template..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setSaveTemplateModalOpen(false);
                  setTemplateName('');
                  setTemplateDescription('');
                }}
                className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!templateName.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
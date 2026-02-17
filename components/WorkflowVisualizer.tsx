import React, { useState } from 'react';
import { WorkflowResult, WorkflowStep } from '../types';
import { chatWithStep } from '../services/aiService';
import { 
  Bot, 
  Clock, 
  ArrowDown, 
  Database, 
  FileInput, 
  CheckCircle2,
  Zap,
  User,
  Repeat,
  MessageSquare,
  Send,
  Loader2,
  Sparkles,
  X
} from 'lucide-react';

interface WorkflowVisualizerProps {
  data: WorkflowResult;
}

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface StepChatState {
  messages: ChatMessage[];
  loading: boolean;
}

const getIconForTiming = (timing: string) => {
  switch (timing.toLowerCase()) {
    case 'auto': return <Zap className="w-4 h-4 text-yellow-500" />;
    case 'manual': return <User className="w-4 h-4 text-blue-500" />;
    case 'recurring': return <Repeat className="w-4 h-4 text-purple-500" />;
    case 'trigger': return <Clock className="w-4 h-4 text-orange-500" />;
    default: return <Clock className="w-4 h-4 text-gray-500" />;
  }
};

const getAgentColor = (agent: string) => {
  const normalized = agent.toLowerCase();
  if (normalized.includes('content')) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (normalized.includes('design')) return 'bg-pink-100 text-pink-700 border-pink-200';
  if (normalized.includes('schedule')) return 'bg-purple-100 text-purple-700 border-purple-200';
  if (normalized.includes('analytics') || normalized.includes('heatmap')) return 'bg-green-100 text-green-700 border-green-200';
  if (normalized.includes('scraper')) return 'bg-orange-100 text-orange-700 border-orange-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
};

const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = ({ data }) => {
  // State to track which chat is open
  const [openChatStepId, setOpenChatStepId] = useState<number | null>(null);
  
  // State to store chat history per step
  const [chats, setChats] = useState<Record<number, StepChatState>>({});
  
  // State for current input per step
  const [inputs, setInputs] = useState<Record<number, string>>({});

  const toggleChat = (stepId: number) => {
    if (openChatStepId === stepId) {
      setOpenChatStepId(null);
    } else {
      setOpenChatStepId(stepId);
      // Initialize chat state if not exists
      if (!chats[stepId]) {
        setChats(prev => ({
          ...prev,
          [stepId]: { messages: [], loading: false }
        }));
      }
    }
  };

  const handleSendMessage = async (step: WorkflowStep, customMessage?: string) => {
    const messageToSend = customMessage || inputs[step.step_id];
    if (!messageToSend?.trim()) return;

    const stepId = step.step_id;

    // Update UI with user message
    setChats(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        messages: [...(prev[stepId]?.messages || []), { role: 'user', content: messageToSend }],
        loading: true
      }
    }));
    
    // Clear input
    if (!customMessage) {
      setInputs(prev => ({ ...prev, [stepId]: '' }));
    }

    try {
      const currentHistory = chats[stepId]?.messages || [];
      const response = await chatWithStep(
        step, 
        data.workflow_metadata.name, 
        messageToSend, 
        currentHistory
      );

      setChats(prev => ({
        ...prev,
        [stepId]: {
          messages: [...prev[stepId].messages, { role: 'model', content: response }],
          loading: false
        }
      }));
    } catch (error) {
      console.error("Failed to send message", error);
      setChats(prev => ({
        ...prev,
        [stepId]: {
          ...prev[stepId],
          loading: false
        }
      }));
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{data.workflow_metadata.name}</h2>
          <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
            <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">v{data.workflow_metadata.version}</span>
            <span>{data.workflow_metadata.is_template ? 'Template' : 'Instance'}</span>
          </div>
        </div>
        <div className="mt-4 md:mt-0">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            <CheckCircle2 className="w-4 h-4" />
            Workflow Validated
          </span>
        </div>
      </div>

      <div className="relative">
        {/* Connector Line */}
        <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-slate-200 hidden md:block" />

        <div className="space-y-6">
          {data.steps.map((step, index) => (
            <div key={step.step_id} className="relative flex flex-col md:flex-row gap-6 group">
              {/* Timeline Node */}
              <div className="hidden md:flex flex-col items-center z-10">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm border-2 bg-white transition-all group-hover:scale-105 ${getAgentColor(step.agent_type).replace('bg-', 'border-')}`}>
                  <span className="text-xl font-bold text-slate-600">{step.step_id}</span>
                </div>
                {index !== data.steps.length - 1 && (
                  <div className="flex-1 w-0.5 bg-slate-200 my-2" />
                )}
              </div>

              {/* Card */}
              <div className="flex-1">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden">
                  
                  {/* Main Card Content */}
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 font-bold text-slate-600">
                          {step.step_id}
                        </div>
                        <div>
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 ${getAgentColor(step.agent_type)}`}>
                            <Bot className="w-3 h-3" />
                            {step.agent_type}
                          </div>
                          <h3 className="text-lg font-semibold text-slate-800 leading-tight">
                            {step.action_description}
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 self-start">
                         {getIconForTiming(step.timing_logic)}
                         <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">{step.timing_logic}</span>
                      </div>
                    </div>

                    {/* Enhanced Data Flow Visualization */}
                    <div className="mt-6 p-4 bg-slate-50/80 rounded-xl border border-slate-200/60">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Input Section */}
                        <div className="flex-1 relative">
                           <div className="flex items-center gap-2 mb-2">
                              <div className="p-1.5 bg-white rounded-md border border-slate-200 shadow-sm text-slate-500">
                                <FileInput className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Input Context</span>
                           </div>
                           <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm space-y-2">
                              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                <span className="text-xs text-slate-400 font-medium">Source</span>
                                <span className="text-sm font-semibold text-slate-700">{step.input_config.source}</span>
                              </div>
                              <div className="flex justify-between items-center pt-0.5">
                                <span className="text-xs text-slate-400 font-medium">Format</span>
                                <code className="text-xs font-mono text-pink-600 bg-pink-50 px-2 py-0.5 rounded border border-pink-100">
                                  {step.input_config.type}
                                </code>
                              </div>
                           </div>
                           {/* Arrow for desktop */}
                           <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                              <div className="bg-white rounded-full p-1 border border-slate-200 shadow-sm text-slate-300">
                                <ArrowDown className="w-3 h-3 -rotate-90" />
                              </div>
                           </div>
                        </div>

                        {/* Output Section */}
                        <div className="flex-1">
                           <div className="flex items-center gap-2 mb-2">
                              <div className="p-1.5 bg-white rounded-md border border-slate-200 shadow-sm text-slate-500">
                                <Database className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Output Artifact</span>
                           </div>
                           <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm h-[calc(100%-32px)] flex items-center">
                              <code className="text-sm font-mono text-indigo-600 w-full break-all">
                                {step.output_storage}
                              </code>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-medium">Step ID: {step.step_id}</span>
                    <button 
                      onClick={() => toggleChat(step.step_id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        openChatStepId === step.step_id 
                          ? 'bg-indigo-100 text-indigo-700' 
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      {openChatStepId === step.step_id ? 'Close Assistant' : 'Optimize Step'}
                    </button>
                  </div>

                  {/* Chat Interface (Expandable) */}
                  {openChatStepId === step.step_id && (
                    <div className="border-t border-slate-200 bg-slate-50 animate-in slide-in-from-top-2 duration-200">
                      <div className="p-4 h-80 overflow-y-auto custom-scrollbar space-y-4 flex flex-col">
                        {(!chats[step.step_id]?.messages || chats[step.step_id].messages.length === 0) && (
                          <div className="text-center py-8 text-slate-500">
                            <Bot className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                            <p className="text-sm font-medium">How can I help optimize this step?</p>
                            <div className="flex flex-wrap justify-center gap-2 mt-4">
                              <button 
                                onClick={() => handleSendMessage(step, "Generate a Master System Prompt for this agent.")}
                                className="text-xs bg-white border border-indigo-100 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-50 transition-colors flex items-center gap-1.5"
                              >
                                <Sparkles className="w-3 h-3" />
                                Generate Master Prompt
                              </button>
                              <button 
                                onClick={() => handleSendMessage(step, "Suggest specific tools or libraries for this action.")}
                                className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors"
                              >
                                Suggest Tools
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {chats[step.step_id]?.messages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                              msg.role === 'user' 
                                ? 'bg-indigo-600 text-white rounded-br-none' 
                                : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                            }`}>
                              {msg.role === 'model' ? (
                                <div className="prose prose-sm max-w-none prose-p:my-1 prose-pre:bg-slate-900 prose-pre:text-slate-100">
                                   {msg.content.split('\n').map((line, idx) => (
                                     <p key={idx} className="mb-1">{line}</p>
                                   ))}
                                </div>
                              ) : (
                                msg.content
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {chats[step.step_id]?.loading && (
                          <div className="flex justify-start">
                            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-3 bg-white border-t border-slate-200">
                        <form 
                          onSubmit={(e) => { e.preventDefault(); handleSendMessage(step); }}
                          className="flex gap-2"
                        >
                          <input
                            type="text"
                            value={inputs[step.step_id] || ''}
                            onChange={(e) => setInputs(prev => ({ ...prev, [step.step_id]: e.target.value }))}
                            placeholder="Ask about inputs, outputs, or configuration..."
                            className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                          />
                          <button 
                            type="submit"
                            disabled={!inputs[step.step_id]?.trim() || chats[step.step_id]?.loading}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 transition-colors"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
                
                {index !== data.steps.length - 1 && (
                  <div className="flex md:hidden justify-center py-2 text-slate-300">
                    <ArrowDown className="w-6 h-6" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkflowVisualizer;
import React, { useState, useEffect } from 'react';
import { WorkflowStep, InputConfig } from '../types';
import { AGENT_LIBRARY, Agent, getAgentsByType } from '../data/agentLibrary';
import { X, Plus, Trash2, Save } from 'lucide-react';

interface StepEditorProps {
    step: WorkflowStep | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (step: WorkflowStep) => void;
    isNewStep?: boolean;
}

const AGENT_TYPES = [
    'Content', 'Design', 'Scheduler', 'Heatmaps', 'Bounce',
    'Subject Line Checker', 'Scraper', 'CRM', 'Outreach', 'Analytics'
];

const TIMING_OPTIONS = ['Manual', 'Auto', 'Trigger', 'Recurring'];

export const StepEditor: React.FC<StepEditorProps> = ({
    step,
    isOpen,
    onClose,
    onSave,
    isNewStep = false
}) => {
    const [editedStep, setEditedStep] = useState<WorkflowStep>({
        step_id: 1,
        agent_type: 'Content',
        agent_ids: [],
        action_description: '',
        timing_logic: 'Manual',
        input_config: { source: 'PM_Input', type: 'Raw_Text' },
        output_storage: ''
    });

    const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
    const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

    useEffect(() => {
        if (step) {
            setEditedStep(step);
            setSelectedAgents(step.agent_ids || []);
        }
    }, [step]);

    useEffect(() => {
        const agents = getAgentsByType(editedStep.agent_type);
        setAvailableAgents(agents);
    }, [editedStep.agent_type]);

    const handleSave = () => {
        onSave({
            ...editedStep,
            agent_ids: selectedAgents
        });
        onClose();
    };

    const toggleAgent = (agentId: string) => {
        setSelectedAgents(prev =>
            prev.includes(agentId)
                ? prev.filter(id => id !== agentId)
                : [...prev, agentId]
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold">
                        {isNewStep ? '➕ Add New Step' : '✏️ Edit Step'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Step ID */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Step ID
                        </label>
                        <input
                            type="number"
                            value={editedStep.step_id}
                            onChange={(e) => setEditedStep({ ...editedStep, step_id: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            disabled={!isNewStep}
                        />
                    </div>

                    {/* Agent Type */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Agent Type
                        </label>
                        <select
                            value={editedStep.agent_type}
                            onChange={(e) => setEditedStep({ ...editedStep, agent_type: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            {AGENT_TYPES.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    {/* Agent Library Selection */}
                    {availableAgents.length > 0 && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Select Agents from Library
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-3 bg-gray-50 rounded-lg">
                                {availableAgents.map(agent => (
                                    <div
                                        key={agent.id}
                                        onClick={() => toggleAgent(agent.id)}
                                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedAgents.includes(agent.id)
                                                ? 'border-indigo-500 bg-indigo-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <span className="text-2xl">{agent.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-sm text-gray-900 truncate">
                                                    {agent.name}
                                                </div>
                                                <div className="text-xs text-gray-600 line-clamp-2">
                                                    {agent.description}
                                                </div>
                                            </div>
                                            {selectedAgents.includes(agent.id) && (
                                                <div className="text-indigo-600">✓</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {selectedAgents.length > 0 && (
                                <div className="mt-2 text-sm text-gray-600">
                                    Selected: {selectedAgents.length} agent(s)
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Action Description
                        </label>
                        <textarea
                            value={editedStep.action_description}
                            onChange={(e) => setEditedStep({ ...editedStep, action_description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                            placeholder="Describe what this step does..."
                        />
                    </div>

                    {/* Timing Logic */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Timing Logic
                        </label>
                        <select
                            value={editedStep.timing_logic}
                            onChange={(e) => setEditedStep({ ...editedStep, timing_logic: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            {TIMING_OPTIONS.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>

                    {/* Input Configuration */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Input Source
                            </label>
                            <input
                                type="text"
                                value={editedStep.input_config.source}
                                onChange={(e) => setEditedStep({
                                    ...editedStep,
                                    input_config: { ...editedStep.input_config, source: e.target.value }
                                })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., PM_Input, Step_1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Input Type
                            </label>
                            <input
                                type="text"
                                value={editedStep.input_config.type}
                                onChange={(e) => setEditedStep({
                                    ...editedStep,
                                    input_config: { ...editedStep.input_config, type: e.target.value }
                                })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., Raw_Text, JSON"
                            />
                        </div>
                    </div>

                    {/* Output Storage */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Output Storage
                        </label>
                        <input
                            type="text"
                            value={editedStep.output_storage}
                            onChange={(e) => setEditedStep({ ...editedStep, output_storage: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="e.g., s3://bucket/path, database://table"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Save Step
                    </button>
                </div>
            </div>
        </div>
    );
};

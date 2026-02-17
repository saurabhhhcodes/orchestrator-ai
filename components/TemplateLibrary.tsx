import React, { useState, useEffect } from 'react';
import { WorkflowTemplate, getTemplates, deleteTemplate, getTemplateById } from '../services/templateService';
import { WorkflowResult } from '../types';
import { FileText, Trash2, Copy, Download, X } from 'lucide-react';

interface TemplateLibraryProps {
    isOpen: boolean;
    onClose: () => void;
    onLoadTemplate: (workflow: WorkflowResult) => void;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
    isOpen,
    onClose,
    onLoadTemplate
}) => {
    const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadTemplates();
        }
    }, [isOpen]);

    const loadTemplates = () => {
        setTemplates(getTemplates());
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this template?')) {
            deleteTemplate(id);
            loadTemplates();
            if (selectedTemplate?.id === id) {
                setSelectedTemplate(null);
            }
        }
    };

    const handleLoad = (template: WorkflowTemplate) => {
        onLoadTemplate(template.workflow);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6" />
                        <h2 className="text-xl font-bold">Workflow Templates</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Template List */}
                    <div className="w-1/3 border-r border-gray-200 overflow-y-auto p-4">
                        {templates.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                <p className="font-medium">No templates yet</p>
                                <p className="text-sm mt-2">Save a workflow to create your first template</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {templates.map(template => (
                                    <div
                                        key={template.id}
                                        onClick={() => setSelectedTemplate(template)}
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedTemplate?.id === template.id
                                                ? 'border-emerald-500 bg-emerald-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 truncate">
                                                    {template.name}
                                                </h3>
                                                <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                                                    {template.description || 'No description'}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                        {template.workflow.steps.length} steps
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(template.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => handleDelete(template.id, e)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Template Preview */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {selectedTemplate ? (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                        {selectedTemplate.name}
                                    </h3>
                                    <p className="text-gray-600">
                                        {selectedTemplate.description || 'No description provided'}
                                    </p>
                                    <div className="flex items-center gap-3 mt-4">
                                        {selectedTemplate.tags.map(tag => (
                                            <span key={tag} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Workflow Metadata */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-900 mb-3">Workflow Details</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600">Workflow Name:</span>
                                            <p className="font-medium text-gray-900">
                                                {selectedTemplate.workflow.workflow_metadata.workflow_name}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Version:</span>
                                            <p className="font-medium text-gray-900">
                                                {selectedTemplate.workflow.workflow_metadata.version}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Steps:</span>
                                            <p className="font-medium text-gray-900">
                                                {selectedTemplate.workflow.steps.length}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Created:</span>
                                            <p className="font-medium text-gray-900">
                                                {new Date(selectedTemplate.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Steps Preview */}
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-3">Workflow Steps</h4>
                                    <div className="space-y-3">
                                        {selectedTemplate.workflow.steps.map(step => (
                                            <div key={step.step_id} className="bg-white border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-sm">
                                                        {step.step_id}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-semibold text-gray-900">{step.agent_type}</span>
                                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                                                {step.timing_logic}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600">{step.action_description}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => handleLoad(selectedTemplate)}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-5 h-5" />
                                        Load Template
                                    </button>
                                    <button
                                        onClick={() => {
                                            const cloned = {
                                                ...selectedTemplate.workflow,
                                                workflow_metadata: {
                                                    ...selectedTemplate.workflow.workflow_metadata,
                                                    workflow_name: `${selectedTemplate.workflow.workflow_metadata.workflow_name} (Copy)`
                                                }
                                            };
                                            onLoadTemplate(cloned);
                                            onClose();
                                        }}
                                        className="px-6 py-3 border-2 border-emerald-600 text-emerald-600 rounded-lg font-medium hover:bg-emerald-50 transition-all flex items-center gap-2"
                                    >
                                        <Copy className="w-5 h-5" />
                                        Clone
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                <div className="text-center">
                                    <FileText className="w-20 h-20 mx-auto mb-4 opacity-30" />
                                    <p className="text-lg">Select a template to preview</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

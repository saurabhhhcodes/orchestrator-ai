import React, { useState, useEffect, useRef } from 'react';
import {
    WorkflowTemplate, getTemplates, deleteTemplate,
    exportTemplateToJSON, importTemplateFromJSON, restoreTemplateVersion, cloneTemplate
} from '../services/templateService';
import { WorkflowResult } from '../types';
import {
    FileText, Trash2, Download, Upload, X, Copy, History,
    CheckCircle2, Search, ChevronRight, Tag
} from 'lucide-react';

interface TemplateLibraryProps {
    isOpen: boolean;
    onClose: () => void;
    onLoadTemplate: (workflow: WorkflowResult) => void;
    /** When true, renders inline (no modal container) */
    inline?: boolean;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
    isOpen,
    onClose,
    onLoadTemplate,
    inline = false,
}) => {
    const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
    const [selected, setSelected] = useState<WorkflowTemplate | null>(null);
    const [search, setSearch] = useState('');
    const [detailTab, setDetailTab] = useState<'preview' | 'versions'>('preview');
    const [importError, setImportError] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) refresh();
    }, [isOpen]);

    const refresh = () => {
        const list = getTemplates();
        setTemplates(list);
        // keep selection in sync
        if (selected) setSelected(list.find(t => t.id === selected.id) || null);
    };

    const filtered = templates.filter(t =>
        !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(search.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
    );

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Delete this template?')) {
            deleteTemplate(id);
            if (selected?.id === id) setSelected(null);
            refresh();
        }
    };

    const handleLoad = (template: WorkflowTemplate) => {
        onLoadTemplate(template.workflow);
        onClose();
    };

    const handleClone = (template: WorkflowTemplate) => {
        cloneTemplate(template.id);
        refresh();
    };

    const handleExport = (template: WorkflowTemplate) => {
        const json = exportTemplateToJSON(template.id);
        if (!json) return;
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${template.name.replace(/\s+/g, '_')}.json`;
        a.click(); URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const json = ev.target?.result as string;
            const imported = importTemplateFromJSON(json);
            if (imported) { setImportError(''); refresh(); }
            else setImportError('Invalid template file. Please use a previously exported JSON.');
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleRestoreVersion = (templateId: string, versionId: string) => {
        restoreTemplateVersion(templateId, versionId);
        refresh();
    };

    const content = (
        <div className={`flex flex-col ${inline ? 'h-full' : 'h-[80vh]'}`}>
            {/* Header — only shown in modal mode */}
            {!inline && (
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4 flex items-center justify-between shrink-0 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6" />
                        <h2 className="text-xl font-bold">Workflow Templates</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                </div>
            )}

            {/* Toolbar */}
            <div className="shrink-0 px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-36">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search templates…"
                        className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <input ref={fileRef} type="file" className="hidden" accept=".json" onChange={handleImport} />
                <button
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                >
                    <Upload className="w-4 h-4" /> Import JSON
                </button>
                {importError && <span className="text-xs text-red-600">{importError}</span>}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-hidden flex">
                {/* Template list */}
                <div className={`${inline ? 'w-full md:w-1/3' : 'w-1/3'} border-r border-slate-200 overflow-y-auto p-3 space-y-2`}>
                    {filtered.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">{templates.length === 0 ? 'No templates saved yet' : 'No results'}</p>
                            {templates.length === 0 && <p className="text-xs mt-1">Generate a workflow and save as template.</p>}
                        </div>
                    ) : filtered.map(t => (
                        <div
                            key={t.id}
                            onClick={() => { setSelected(t); setDetailTab('preview'); }}
                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${selected?.id === t.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                        >
                            <div className="flex items-start justify-between gap-1.5">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm text-slate-800 truncate">{t.name}</h3>
                                    {t.description && <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{t.description}</p>}
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                        {t.tags.map(tag => (
                                            <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-xs">
                                                <Tag className="w-2.5 h-2.5" />{tag}
                                            </span>
                                        ))}
                                        <span className="text-xs text-slate-400">{t.workflow.steps.length} steps</span>
                                        {(t.versions?.length || 0) > 1 && (
                                            <span className="text-xs text-purple-500">v{t.versions?.length}</span>
                                        )}
                                    </div>
                                </div>
                                <button onClick={e => handleDelete(t.id, e)} className="p-1 text-red-400 hover:bg-red-50 rounded shrink-0 hover:text-red-600 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Template detail / preview */}
                <div className="flex-1 overflow-y-auto p-5">
                    {selected ? (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{selected.name}</h3>
                                <p className="text-slate-500 text-sm mt-1">{selected.description || 'No description'}</p>
                                <div className="flex gap-2 mt-3">
                                    <span className="text-xs text-slate-400">Created: {new Date(selected.createdAt).toLocaleDateString()}</span>
                                    <span className="text-xs text-slate-400">·</span>
                                    <span className="text-xs text-slate-400">Updated: {new Date(selected.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-1 border-b border-slate-200">
                                {(['preview', 'versions'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setDetailTab(tab)}
                                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${detailTab === tab ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {tab === 'versions' ? <span className="flex items-center gap-1"><History className="w-3.5 h-3.5" />Versions {selected.versions?.length ? `(${selected.versions.length})` : ''}</span> : 'Preview'}
                                    </button>
                                ))}
                            </div>

                            {detailTab === 'preview' && (
                                <div className="space-y-3">
                                    {selected.workflow.steps.map(step => (
                                        <div key={step.step_id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-start gap-3">
                                            <span className="w-7 h-7 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                                {step.step_id}
                                            </span>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-semibold text-sm text-slate-800">{step.agent_type}</span>
                                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{step.timing_logic}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">{step.action_description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {detailTab === 'versions' && (
                                <div className="space-y-2">
                                    {(!selected.versions || selected.versions.length === 0) ? (
                                        <p className="text-sm text-slate-400 text-center py-6">No version history yet.</p>
                                    ) : selected.versions.slice().reverse().map((v, idx) => (
                                        <div key={v.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded">v{v.version}</span>
                                                    {idx === 0 && <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> Current</span>}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">{v.changeNote || 'No note'}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{new Date(v.savedAt).toLocaleString()} · {v.workflow.steps.length} steps</p>
                                            </div>
                                            {idx !== 0 && (
                                                <button
                                                    onClick={() => { if (confirm('Restore this version?')) { handleRestoreVersion(selected.id, v.id); } }}
                                                    className="text-xs px-3 py-1.5 border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors shrink-0"
                                                >
                                                    Restore
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                                <button
                                    onClick={() => handleLoad(selected)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all text-sm"
                                >
                                    <ChevronRight className="w-4 h-4" /> Load Template
                                </button>
                                <button
                                    onClick={() => handleClone(selected)}
                                    className="flex items-center gap-2 px-4 py-2.5 border-2 border-emerald-600 text-emerald-600 rounded-xl font-medium hover:bg-emerald-50 text-sm"
                                >
                                    <Copy className="w-4 h-4" /> Clone
                                </button>
                                <button
                                    onClick={() => handleExport(selected)}
                                    className="flex items-center gap-2 px-4 py-2.5 border-2 border-slate-300 text-slate-600 rounded-xl font-medium hover:bg-slate-50 text-sm"
                                >
                                    <Download className="w-4 h-4" /> Export JSON
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400">
                            <div className="text-center">
                                <FileText className="w-16 h-16 mx-auto mb-3 opacity-20" />
                                <p>Select a template to preview</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (!isOpen) return null;

    if (inline) return content;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {content}
            </div>
        </div>
    );
};

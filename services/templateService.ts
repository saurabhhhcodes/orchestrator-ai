import { WorkflowResult } from '../types';

export interface TemplateVersion {
    id: string;
    version: number;
    workflow: WorkflowResult;
    savedAt: string;
    changeNote: string;
}

export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    workflow: WorkflowResult;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    versions: TemplateVersion[];
}

const STORAGE_KEY = 'workflow_templates';

// ---- Storage helpers ----
const load = (): WorkflowTemplate[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
};
const persist = (templates: WorkflowTemplate[]) =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));

// ---- Save / version ----
export const saveTemplate = (
    workflow: WorkflowResult,
    name: string,
    description: string = '',
    tags: string[] = [],
    changeNote: string = 'Initial save'
): WorkflowTemplate => {
    const templates = load();
    const existing = templates.find(t => t.name === name);
    if (existing) {
        // Create a version snapshot of the OLD state before overwriting
        const newVersion: TemplateVersion = {
            id: `ver_${Date.now()}`,
            version: (existing.versions?.length || 0) + 1,
            workflow: existing.workflow,
            savedAt: existing.updatedAt,
            changeNote,
        };
        const updated: WorkflowTemplate = {
            ...existing,
            workflow,
            description: description || existing.description,
            tags: tags.length ? tags : existing.tags,
            updatedAt: new Date().toISOString(),
            versions: [...(existing.versions || []), newVersion],
        };
        const idx = templates.findIndex(t => t.id === existing.id);
        templates[idx] = updated;
        persist(templates);
        return updated;
    }

    const created: WorkflowTemplate = {
        id: `template_${Date.now()}`,
        name,
        description,
        workflow,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags,
        versions: [],
    };
    templates.push(created);
    persist(templates);
    return created;
};

// ---- CRUD ----
export const getTemplates = (): WorkflowTemplate[] => load();

export const getTemplateById = (id: string): WorkflowTemplate | null =>
    load().find(t => t.id === id) || null;

export const deleteTemplate = (id: string): void => {
    persist(load().filter(t => t.id !== id));
};

export const cloneTemplate = (id: string): WorkflowTemplate | null => {
    const templates = load();
    const original = templates.find(t => t.id === id);
    if (!original) return null;
    const cloned: WorkflowTemplate = {
        ...original,
        id: `template_${Date.now()}`,
        name: `${original.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        versions: [],
    };
    templates.push(cloned);
    persist(templates);
    return cloned;
};

// ---- Versioning ----
export const restoreTemplateVersion = (templateId: string, versionId: string): WorkflowTemplate | null => {
    const templates = load();
    const idx = templates.findIndex(t => t.id === templateId);
    if (idx === -1) return null;
    const template = templates[idx];
    const ver = (template.versions || []).find(v => v.id === versionId);
    if (!ver) return null;
    // Save current state as a new version before restoring
    const snapshot: TemplateVersion = {
        id: `ver_${Date.now()}`,
        version: (template.versions.length || 0) + 1,
        workflow: template.workflow,
        savedAt: template.updatedAt,
        changeNote: `Auto snapshot before restore to v${ver.version}`,
    };
    const restored: WorkflowTemplate = {
        ...template,
        workflow: ver.workflow,
        updatedAt: new Date().toISOString(),
        versions: [...(template.versions || []), snapshot],
    };
    templates[idx] = restored;
    persist(templates);
    return restored;
};

// ---- Export / Import (JSON string, not File) ----
export const exportTemplateToJSON = (id: string): string | null => {
    const template = getTemplateById(id);
    if (!template) return null;
    return JSON.stringify(template, null, 2);
};

export const importTemplateFromJSON = (json: string): WorkflowTemplate | null => {
    try {
        const parsed = JSON.parse(json) as WorkflowTemplate;
        if (!parsed.name || !parsed.workflow) return null;
        const imported: WorkflowTemplate = {
            ...parsed,
            id: `template_${Date.now()}`,
            createdAt: parsed.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            versions: parsed.versions || [],
            tags: parsed.tags || [],
        };
        const templates = load();
        templates.push(imported);
        persist(templates);
        return imported;
    } catch { return null; }
};

import { WorkflowResult } from '../types';

export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    workflow: WorkflowResult;
    createdAt: string;
    tags: string[];
}

const STORAGE_KEY = 'workflow_templates';

export const saveTemplate = (
    workflow: WorkflowResult,
    name: string,
    description: string = '',
    tags: string[] = []
): WorkflowTemplate => {
    const templates = getTemplates();
    const newTemplate: WorkflowTemplate = {
        id: `template_${Date.now()}`,
        name,
        description,
        workflow,
        createdAt: new Date().toISOString(),
        tags
    };

    templates.push(newTemplate);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    return newTemplate;
};

export const getTemplates = (): WorkflowTemplate[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading templates:', error);
        return [];
    }
};

export const getTemplateById = (id: string): WorkflowTemplate | null => {
    const templates = getTemplates();
    return templates.find(t => t.id === id) || null;
};

export const deleteTemplate = (id: string): void => {
    const templates = getTemplates();
    const filtered = templates.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const cloneWorkflow = (
    workflow: WorkflowResult,
    newName: string
): WorkflowResult => {
    return {
        ...workflow,
        workflow_metadata: {
            ...workflow.workflow_metadata,
            workflow_name: newName,
            instance_id: `${workflow.workflow_metadata.instance_id}_clone_${Date.now()}`
        }
    };
};

export const updateTemplate = (
    id: string,
    updates: Partial<Omit<WorkflowTemplate, 'id' | 'createdAt'>>
): void => {
    const templates = getTemplates();
    const index = templates.findIndex(t => t.id === id);

    if (index !== -1) {
        templates[index] = {
            ...templates[index],
            ...updates
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    }
};

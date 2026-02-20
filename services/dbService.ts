/**
 * dbService.ts — Centralised localStorage persistence layer.
 * Handles: prompts history, workflow history, templates, custom agent types, learned preferences.
 */

import { WorkflowResult, WorkflowHistory, LearnedPreference } from '../types';

// ----- Keys -----
const KEYS = {
    PROMPT_HISTORY: 'oai_prompt_history',
    WORKFLOW_HISTORY: 'oai_workflow_history',
    TEMPLATES: 'workflow_templates',
    CUSTOM_AGENT_TYPES: 'oai_custom_agent_types',
    LEARNED_PREFS: 'oai_learned_prefs',
};

// ----- Generic helpers -----
function readJSON<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

function writeJSON<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
}

// ----- Prompt History -----
export const getPromptHistory = (): string[] =>
    readJSON<string[]>(KEYS.PROMPT_HISTORY, []);

export const savePrompt = (prompt: string): void => {
    const history = getPromptHistory();
    const updated = [prompt, ...history.filter(p => p !== prompt)].slice(0, 50);
    writeJSON(KEYS.PROMPT_HISTORY, updated);
};

// ----- Workflow History -----
export const getWorkflowHistory = (): WorkflowHistory[] =>
    readJSON<WorkflowHistory[]>(KEYS.WORKFLOW_HISTORY, []);

export const saveWorkflowToHistory = (prompt: string, workflow: WorkflowResult): void => {
    const history = getWorkflowHistory();
    const entry: WorkflowHistory = {
        id: `wf_${Date.now()}`,
        prompt,
        workflow,
        savedAt: new Date().toISOString(),
    };
    writeJSON(KEYS.WORKFLOW_HISTORY, [entry, ...history].slice(0, 100));
};

// ----- Custom Agent Types -----
const DEFAULT_AGENT_TYPES = [
    'Content', 'Design', 'Scheduler', 'Heatmaps', 'Bounce',
    'Subject Line Checker', 'Scraper', 'CRM', 'Outreach', 'Analytics',
];

export const getAgentTypes = (): string[] => {
    const custom = readJSON<string[]>(KEYS.CUSTOM_AGENT_TYPES, []);
    return [...DEFAULT_AGENT_TYPES, ...custom];
};

export const addCustomAgentType = (type: string): void => {
    const custom = readJSON<string[]>(KEYS.CUSTOM_AGENT_TYPES, []);
    if (!custom.includes(type) && !DEFAULT_AGENT_TYPES.includes(type)) {
        writeJSON(KEYS.CUSTOM_AGENT_TYPES, [...custom, type]);
    }
};

// ----- Learned Preferences -----
export const getLearnedPreferences = (): LearnedPreference[] =>
    readJSON<LearnedPreference[]>(KEYS.LEARNED_PREFS, []);

export const saveLearnedPreference = (pref: Omit<LearnedPreference, 'id' | 'savedAt'>): void => {
    const prefs = getLearnedPreferences();
    const entry: LearnedPreference = {
        ...pref,
        id: `pref_${Date.now()}`,
        savedAt: new Date().toISOString(),
    };
    writeJSON(KEYS.LEARNED_PREFS, [entry, ...prefs].slice(0, 50));
};

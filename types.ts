export type LLMProvider = 'openai';

export interface WorkflowMetadata {
  workflow_name: string;
  instance_id: string;
  is_template: boolean;
  version: string;
}

export interface InputConfig {
  source: string;
  type: string;
}

export interface WorkflowStep {
  step_id: number;
  agent_type: string;
  agent_ids?: string[]; // IDs of specific agents from library
  action_description: string;
  timing_logic: string;
  input_config: InputConfig;
  output_storage: string;
}

export interface WorkflowResult {
  workflow_metadata: WorkflowMetadata;
  steps: WorkflowStep[];
}

export interface AgentTypeStat {
  name: string;
  value: number;
}

export interface TimingStat {
  name: string;
  count: number;
}
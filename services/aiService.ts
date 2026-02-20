import OpenAI from "openai";
import { WorkflowResult, LLMProvider, WorkflowStep, LearnedPreference } from "../types";
import { getLearnedPreferences, saveLearnedPreference } from "./dbService";

// ------------------------------------------------------------------
// CORE PROMPT ARCHITECTURE
// ------------------------------------------------------------------
const SYSTEM_INSTRUCTION = `You are a Senior AI Solutions Architect & Workflow Orchestrator. 
      
Goal: Architect a highly technical, realistic, and executable business workflow based on the user's Business Use Case.

Operational Protocol:
1.  **Realism is paramount.** Do not use generic descriptions like "Analyze data." Instead, use specific technical actions like "Ingest CSV data via Pandas, clean null values, and run sentiment analysis using NLTK."
2.  **Specific Agent Roles:** Assign agents that fit the task precisely.
    *   *Scraper*: Uses tools like Puppeteer/Selenium.
    *   *CRM*: Interacts with Salesforce/HubSpot schemas.
    *   *Content*: Uses LLMs for generation (GPT-4/Claude).
    *   *Analytics*: Uses SQL/Python/Tableau logic.
3.  **Data Harmony:** Ensure step inputs and outputs are technically compatible.
    *   *Input Source*: If Step 1 outputs a JSON object, Step 2 must accept that JSON.
    *   *Output Storage*: Use realistic storage paths (e.g., \`s3://bucket/data.json\`, \`postgres.users_table\`, \`redis:cache:key\`).
4.  **Logic:**
    *   *PM_Input*: The initial raw requirement from the user.
    *   *Agent_ID_{N}*: Refers to the specific output from a previous agent.
5.  **Parallel Steps:** Where logical, group steps that can run concurrently by assigning the same \`parallel_group\` value (e.g. "group_A"). Steps in the same group run in parallel. Use \`depends_on\` to list step_ids that must complete before a step starts.

Generate the JSON response strictly following the provided schema.`;

// ------------------------------------------------------------------
// OPENAI PROVIDER IMPLEMENTATION
// ------------------------------------------------------------------
const generateWithOpenAI = async (useCase: string, learningContext: string = ''): Promise<WorkflowResult> => {
  try {
    const openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    });

    const systemContent = learningContext
      ? `${SYSTEM_INSTRUCTION}\n\n--- LEARNED USER PREFERENCES ---\n${learningContext}`
      : SYSTEM_INSTRUCTION;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemContent },
        {
          role: "user",
          content: `Business Use Case: "${useCase}"\n\nGenerate a comprehensive, production-ready workflow of EXACTLY 8 to 12 steps following this JSON schema:\n\n{
  "workflow_metadata": {
    "workflow_name": "string (Professional, technical name)",
    "instance_id": "string (e.g., instance_v1.0.0)",
    "is_template": "boolean",
    "version": "string (e.g., v1.0.0)"
  },
  "steps": [
    {
      "step_id": "integer",
      "agent_type": "string (one of: Content, Design, Scheduler, Heatmaps, Bounce, Subject Line Checker, Scraper, CRM, Outreach, Analytics)",
      "action_description": "string (detailed technical description)",
      "timing_logic": "string (Manual/Auto/Trigger/Recurring)",
      "parallel_group": "string or null (steps with same group run in parallel)",
      "depends_on": "array of step_ids this step waits for. For step 1 this MUST be []. For step > 1, this MUST contain at least one valid prior step_id (e.g., [1] for step 2) or else the workflow will break.",
      "input_config": {
        "source": "string (e.g., PM_Input or Agent_ID_1_JSON_Output)",
        "type": "string (e.g., JSON, CSV, PNG, Raw Text)",
        "input_type": "prompt | script | prior_output"
      },
      "output_storage": "string (realistic storage destination)"
    }
  ]
}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) throw new Error("No response generated from OpenAI.");

    return JSON.parse(text) as WorkflowResult;
  } catch (error) {
    console.error("OpenAI Provider Error:", error);
    throw error;
  }
};

// ------------------------------------------------------------------
// LEARNING MODULE (FR-LM-06)
// ------------------------------------------------------------------
export const recordWorkflowFeedback = (
  originalPrompt: string,
  originalWorkflow: WorkflowResult,
  editedWorkflow: WorkflowResult
): void => {
  const agentTypeChanges: Record<string, number> = {};
  const timingPreferences: Record<string, number> = {};
  const inputTypePreferences: Record<string, number> = {};

  editedWorkflow.steps.forEach((editedStep, idx) => {
    const originalStep = originalWorkflow.steps[idx];
    if (originalStep) {
      // Track agent type changes
      if (editedStep.agent_type !== originalStep.agent_type) {
        agentTypeChanges[editedStep.agent_type] = (agentTypeChanges[editedStep.agent_type] || 0) + 1;
      }
      // Track timing preferences
      timingPreferences[editedStep.timing_logic] = (timingPreferences[editedStep.timing_logic] || 0) + 1;
      // Track input type preferences
      if (editedStep.input_config.input_type) {
        inputTypePreferences[editedStep.input_config.input_type] = (inputTypePreferences[editedStep.input_config.input_type] || 0) + 1;
      }
    }
  });

  saveLearnedPreference({
    originalPrompt,
    agentTypeChanges,
    timingPreferences,
    inputTypePreferences,
  });
};

export const buildLearningContext = (): string => {
  const prefs = getLearnedPreferences();
  if (prefs.length === 0) return '';

  const agentTotals: Record<string, number> = {};
  const timingTotals: Record<string, number> = {};
  const inputTotals: Record<string, number> = {};

  prefs.forEach(p => {
    Object.entries(p.agentTypeChanges).forEach(([k, v]) => {
      agentTotals[k] = (agentTotals[k] || 0) + v;
    });
    Object.entries(p.timingPreferences).forEach(([k, v]) => {
      timingTotals[k] = (timingTotals[k] || 0) + v;
    });
    Object.entries(p.inputTypePreferences).forEach(([k, v]) => {
      inputTotals[k] = (inputTotals[k] || 0) + v;
    });
  });

  const lines: string[] = [];
  const topAgent = Object.entries(agentTotals).sort((a, b) => b[1] - a[1])[0];
  if (topAgent) lines.push(`- User frequently prefers "${topAgent[0]}" agent type.`);
  const topTiming = Object.entries(timingTotals).sort((a, b) => b[1] - a[1])[0];
  if (topTiming) lines.push(`- User prefers "${topTiming[0]}" timing logic.`);
  const topInput = Object.entries(inputTotals).sort((a, b) => b[1] - a[1])[0];
  if (topInput) lines.push(`- User prefers "${topInput[0]}" input type.`);

  return lines.join('\n');
};

// ------------------------------------------------------------------
// CHAT FUNCTIONALITY
// ------------------------------------------------------------------
export const chatWithStep = async (
  step: WorkflowStep,
  workflowContext: string,
  userMessage: string,
  history: { role: 'user' | 'model'; content: string }[]
): Promise<string> => {
  try {
    const openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are an AI Workflow Architect Assistant. 
You are discussing a specific step in the workflow: "${workflowContext}".

Step Details:
- ID: ${step.step_id}
- Agent Type: ${step.agent_type}
- Action: ${step.action_description}
- Input: Source=${step.input_config.source}, Type=${step.input_config.type}
- Output Storage: ${step.output_storage}
- Timing: ${step.timing_logic}

Goal: Provide specific, technical assistance for this step. 
If asked for a "Master Prompt", generate a high-fidelity system instruction for this specific Agent to perform its Action effectively.
Keep responses concise but highly technical. Use Markdown for formatting.`
      }
    ];

    history.forEach(h => {
      messages.push({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content });
    });
    messages.push({ role: "user", content: userMessage });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || "I couldn't generate a response.";
  } catch (error) {
    console.error("Chat error:", error);
    return "Error generating response. Please try again.";
  }
};

// ------------------------------------------------------------------
// MAIN FACTORY FUNCTION
// ------------------------------------------------------------------
export const generateWorkflow = async (
  useCase: string,
  provider: LLMProvider = 'openai'
): Promise<WorkflowResult> => {
  const learningContext = buildLearningContext();
  switch (provider) {
    case 'openai':
      return generateWithOpenAI(useCase, learningContext);
    default:
      throw new Error(`Provider '${provider}' is not supported.`);
  }
};
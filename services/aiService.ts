import OpenAI from "openai";
import { WorkflowResult, LLMProvider, WorkflowStep } from "../types";

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

Generate the JSON response strictly following the provided schema.`;

// ------------------------------------------------------------------
// OPENAI PROVIDER IMPLEMENTATION
// ------------------------------------------------------------------
const generateWithOpenAI = async (useCase: string): Promise<WorkflowResult> => {
  try {
    const openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // Required for client-side usage
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: SYSTEM_INSTRUCTION
        },
        {
          role: "user",
          content: `Business Use Case: "${useCase}"\n\nGenerate a workflow following this JSON schema:\n\n{
  "workflow_metadata": {
    "name": "string (Professional, technical name)",
    "is_template": "boolean",
    "version": "string (e.g., 1.0.0)"
  },
  "steps": [
    {
      "step_id": "integer",
      "agent_type": "string (one of: Content, Design, Scheduler, Heatmaps, Bounce, Subject Line Checker, Scraper, CRM, Outreach, Analytics)",
      "action_description": "string (detailed technical description)",
      "timing_logic": "string (Manual/Auto/Trigger/Recurring)",
      "input_config": {
        "source": "string (e.g., PM_Input or Agent_ID_1_JSON_Output)",
        "type": "string (e.g., JSON, CSV, PNG, Raw Text)"
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
// CHAT FUNCTIONALITY
// ------------------------------------------------------------------
export const chatWithStep = async (
  step: WorkflowStep,
  workflowContext: string,
  userMessage: string,
  history: { role: 'user' | 'model', content: string }[]
): Promise<string> => {
  try {
    const openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });

    // Convert history to OpenAI format
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

    // Add conversation history
    history.forEach(h => {
      messages.push({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.content
      });
    });

    // Add current user message
    messages.push({
      role: "user",
      content: userMessage
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
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
export const generateWorkflow = async (useCase: string, provider: LLMProvider = 'openai'): Promise<WorkflowResult> => {
  switch (provider) {
    case 'openai':
      return generateWithOpenAI(useCase);
    default:
      throw new Error(`Provider '${provider}' is not supported.`);
  }
};
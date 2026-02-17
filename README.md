# Orchestrator AI

AI-powered workflow orchestrator that generates technical, executable business workflows using OpenAI's GPT-4o.

## Features

- **Workflow Generation**: Describe a business use case and get a detailed, technical workflow
- **Visual Flow**: Interactive visualization of workflow steps
- **Analytics Dashboard**: Insights into workflow structure and agent distribution
- **JSON Export**: Export workflows as structured JSON

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with your OpenAI API key:
   ```bash
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment on Netlify

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Configure environment variables in Netlify:
   - `VITE_OPENAI_API_KEY`: Your OpenAI API key
4. Deploy!

Netlify will automatically use the `netlify.toml` configuration.

## Tech Stack

- React 19
- TypeScript
- Vite
- OpenAI API (GPT-4o)
- Recharts (Analytics)
- Lucide React (Icons)

## Security Note

⚠️ This is a client-side application, which means the OpenAI API key is exposed in the browser. For production use, consider implementing a backend API to protect your API key.

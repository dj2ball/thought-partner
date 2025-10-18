export type IterativeConfig = { default_loops: number; max_loops: number };

// Enhanced input definition for dynamic forms
export type InputDefinition = {
  name: string;
  prompt: string;
  type: 'text' | 'integer' | 'array' | 'boolean';
  required: boolean;
  default?: any;
  range?: [number, number];
  examples?: string[];
  multiline?: boolean;
};

// Recipe metadata for enhanced UI
export type RecipeMeta = {
  complexity: 'beginner' | 'intermediate' | 'advanced';
  time_estimate: string;
  tags: string[];
  works_well_with?: string[];
};

// Workflow configurations for different runner types
export type WorkflowConfig = {
  type: 'single_shot' | 'chain' | 'parallel' | 'iterative' | 'orchestrator' | 'routing';
  parallel?: {
    mode: 'branching' | 'voting';
    branches: Array<{
      name: string;
      prompt: string;
      temperature?: number;
      response_schema?: any;
    }>;
    synthesis?: {
      prompt: string;
      response_schema?: any;
    };
  };
  // Add other workflow types as needed
};

export type Recipe = {
  id: string; 
  name: string; 
  description: string; 
  inputs: string[] | InputDefinition[]; // Support both old and new formats
  user_prompt_template: string; 
  run_mode: "one-shot" | "iterative"; // Legacy field for backward compatibility
  workflow?: WorkflowConfig; // New workflow configuration
  iterative?: IterativeConfig; 
  meta?: RecipeMeta;
  ui_preferences?: Record<string, any>;
};

export type ChatMessage = {
  id: string; role: "user"|"assistant"; text?: string; recipeId?: string;
  params?: Record<string, any>; mode?: "one-shot"|"iterative"; loops?: number;
  result?: any; error?: string; createdAt: string;
};
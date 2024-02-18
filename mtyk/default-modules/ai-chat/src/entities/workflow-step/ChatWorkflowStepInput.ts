export type ChatWorkflowInputOutputType = 'string' |
  'number' |
  'boolean' |
  'object' |
  'array';
export type ChatWorkflowStepInput = {
  id: string;
  type: ChatWorkflowInputOutputType;
};
export type ChatWorkflowStepOutput = {
  id: string;
  type: ChatWorkflowInputOutputType;
};
export type ChatWorkflowStepType = 'llm' | 'code';
export type ChatWorkflowStepData = {
  type: 'llm';
  prompt: string;
} |
{
  type: 'code';
  language: 'typescript';
  description: string;
  code: string;
};

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ParameterDefinition>;
  required?: string[];
}

export interface ParameterDefinition {
  type: 'string' | 'number' | 'boolean' | 'date';
  description: string;
  enum?: string[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
}

export interface ToolCall {
  toolName: string;
  parameters: Record<string, unknown>;
  timestamp: Date;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  sources?: string[];
}

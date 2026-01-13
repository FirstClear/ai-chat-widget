/**
 * Core types for AI Chat Widget
 */

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  name?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  timestamp?: number;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatContext {
  messages: Message[];
  systemPrompt?: string;
  pinnedMessages?: Message[];
  metadata?: Record<string, any>;
}

export interface ProviderConfig {
  provider: 'openai' | 'claude' | 'moonshot' | 'local';
  apiKey?: string;
  baseURL?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface StreamChunk {
  content?: string;
  toolCalls?: ToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: 'stop' | 'length' | 'tool_calls' | 'error';
  done?: boolean;
}

export interface MemoryConfig {
  maxMessages?: number;
  maxTokens?: number;
  enableSummarization?: boolean;
  systemPromptLocked?: boolean;
}

export interface PluginContext {
  messages: Message[];
  systemPrompt?: string;
  metadata?: Record<string, any>;
  abortSignal?: AbortSignal;
}

export interface ChatPlugin {
  name: string;
  beforeSend?: (ctx: PluginContext) => Promise<PluginContext> | PluginContext;
  afterReceive?: (ctx: PluginContext & { response: Message }) => Promise<Message> | Message;
  onToolCall?: (tool: ToolCall, ctx: PluginContext) => Promise<any>;
}

export interface AIChatWidgetProps {
  provider: ProviderConfig['provider'];
  apiKey?: string;
  baseURL?: string;
  model: string;
  system?: string;
  memory?: number | MemoryConfig;
  plugins?: ChatPlugin[];
  onMessage?: (message: Message) => void;
  onError?: (error: Error) => void;
  className?: string;
  style?: Record<string, string | number>;
}

export interface ProviderResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: 'stop' | 'length' | 'tool_calls' | 'error';
}

export interface ProviderAdapter {
  name: string;
  stream(
    messages: Message[],
    config: ProviderConfig,
    signal?: AbortSignal
  ): AsyncIterable<StreamChunk>;
  chat(
    messages: Message[],
    config: ProviderConfig,
    signal?: AbortSignal
  ): Promise<ProviderResponse>;
}


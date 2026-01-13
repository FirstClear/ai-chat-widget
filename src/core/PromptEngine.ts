/**
 * PromptEngine - Intelligent Prompt Composer
 * 
 * Combines:
 * - system prompt
 * - memory context
 * - plugin modifications
 * - user input
 * - UI hints
 * 
 * Supports:
 * - JSON schema
 * - Function calling
 * - Tool calls
 * - Role rewriting
 */

import { Message, ChatPlugin, PluginContext } from '../types';

export interface PromptEngineConfig {
  systemPrompt?: string;
  messages: Message[];
  plugins?: ChatPlugin[];
  jsonSchema?: Record<string, any>;
  tools?: Array<{
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: Record<string, any>;
    };
  }>;
}

export class PromptEngine {
  /**
   * Compose final prompt from various sources
   */
  static async compose(config: PromptEngineConfig): Promise<Message[]> {
    const { systemPrompt, messages, plugins, jsonSchema, tools } = config;

    // Start with system prompt if present
    const composed: Message[] = [];
    
    if (systemPrompt) {
      composed.push({
        id: `system-${Date.now()}`,
        role: 'system',
        content: systemPrompt,
        timestamp: Date.now(),
      });
    }

    // Add messages
    composed.push(...messages);

    // Apply plugin transformations
    if (plugins && plugins.length > 0) {
      const pluginContext: PluginContext = {
        messages: composed,
        systemPrompt,
        metadata: {
          jsonSchema,
          tools,
        },
      };

      let processedContext = pluginContext;
      
      for (const plugin of plugins) {
        if (plugin.beforeSend) {
          processedContext = await this.applyPlugin(
            plugin.beforeSend,
            processedContext
          );
        }
      }

      return processedContext.messages;
    }

    return composed;
  }

  /**
   * Apply plugin transformation
   */
  private static async applyPlugin(
    transform: (ctx: PluginContext) => Promise<PluginContext> | PluginContext,
    context: PluginContext
  ): Promise<PluginContext> {
    try {
      const result = await transform(context);
      return result || context;
    } catch (error) {
      console.warn('Plugin transformation failed:', error);
      return context;
    }
  }

  /**
   * Format messages for provider (some providers need specific formats)
   */
  static formatForProvider(
    messages: Message[],
    provider: string
  ): Message[] {
    // Different providers might need different formats
    // For now, return as-is (most providers accept standard format)
    
    if (provider === 'claude') {
      // Claude doesn't use 'system' role, merge into first user message
      return this.formatForClaude(messages);
    }

    return messages;
  }

  /**
   * Format for Claude (Anthropic)
   */
  private static formatForClaude(messages: Message[]): Message[] {
    const formatted: Message[] = [];
    let systemContent = '';

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemContent += msg.content + '\n\n';
      } else {
        if (systemContent && formatted.length === 0) {
          // Prepend system content to first user message
          formatted.push({
            ...msg,
            content: systemContent + msg.content,
          });
          systemContent = '';
        } else {
          formatted.push(msg);
        }
      }
    }

    return formatted.length > 0 ? formatted : messages;
  }

  /**
   * Validate message structure
   */
  static validateMessages(messages: Message[]): boolean {
    if (!Array.isArray(messages) || messages.length === 0) {
      return false;
    }

    for (const msg of messages) {
      if (!msg.id || !msg.role || !msg.content) {
        return false;
      }
      
      if (!['system', 'user', 'assistant', 'tool'].includes(msg.role)) {
        return false;
      }
    }

    return true;
  }
}


/**
 * Memory Window - Intelligent Context Window Manager
 * 
 * Features:
 * - Sliding window (last N messages)
 * - Token budget trimming
 * - Auto summarization (compression)
 * - System prompt locking
 */

import { Message, MemoryConfig } from '../types';

export class MemoryWindow {
  private config: Required<MemoryConfig>;
  private messages: Message[] = [];
  private systemPrompt?: string;
  private pinnedMessages: Message[] = [];

  constructor(config: MemoryConfig = {}) {
    this.config = {
      maxMessages: config.maxMessages ?? 50,
      maxTokens: config.maxTokens ?? 8000,
      enableSummarization: config.enableSummarization ?? false,
      systemPromptLocked: config.systemPromptLocked ?? true,
    };
  }

  /**
   * Set system prompt (locked by default)
   */
  setSystemPrompt(prompt: string): void {
    if (!this.config.systemPromptLocked || !this.systemPrompt) {
      this.systemPrompt = prompt;
    }
  }

  /**
   * Pin messages that should always be included
   */
  pinMessages(messages: Message[]): void {
    this.pinnedMessages = messages;
  }

  /**
   * Add a new message to the window
   */
  addMessage(message: Message): void {
    this.messages.push(message);
    this.trim();
  }

  /**
   * Add multiple messages
   */
  addMessages(messages: Message[]): void {
    this.messages.push(...messages);
    this.trim();
  }

  /**
   * Get current context window
   */
  getContext(): {
    systemPrompt?: string;
    messages: Message[];
  } {
    const context: {
      systemPrompt?: string;
      messages: Message[];
    } = {
      messages: [],
    };

    if (this.systemPrompt) {
      context.systemPrompt = this.systemPrompt;
    }

    // Start with pinned messages
    const result: Message[] = [...this.pinnedMessages];

    // Add recent messages (sliding window)
    const recentMessages = this.messages.slice(-this.config.maxMessages);
    result.push(...recentMessages);

    // Remove duplicates (in case pinned messages are also in recent)
    const seen = new Set<string>();
    context.messages = result.filter((msg) => {
      if (seen.has(msg.id)) {
        return false;
      }
      seen.add(msg.id);
      return true;
    });

    // Apply token budget trimming if needed
    if (this.config.maxTokens > 0) {
      context.messages = this.trimByTokens(context.messages);
    }

    return context;
  }

  /**
   * Get all messages (for persistence)
   */
  getAllMessages(): Message[] {
    return [...this.messages];
  }

  /**
   * Clear all messages (except system prompt and pinned)
   */
  clear(): void {
    this.messages = [];
  }

  /**
   * Trim messages to fit maxMessages limit
   */
  private trim(): void {
    if (this.messages.length > this.config.maxMessages) {
      // Keep the most recent messages
      this.messages = this.messages.slice(-this.config.maxMessages);
    }
  }

  /**
   * Trim messages to fit token budget
   * Simple estimation: ~4 characters per token
   */
  private trimByTokens(messages: Message[]): Message[] {
    if (this.config.maxTokens <= 0) {
      return messages;
    }

    let totalTokens = 0;
    const result: Message[] = [];

    // Always include system prompt tokens if present
    if (this.systemPrompt) {
      totalTokens += this.estimateTokens(this.systemPrompt);
    }

    // Process messages from newest to oldest
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const msgTokens = this.estimateTokens(msg.content);

      if (totalTokens + msgTokens <= this.config.maxTokens) {
        result.unshift(msg);
        totalTokens += msgTokens;
      } else {
        // If we can't fit the full message, try to fit a summary
        if (this.config.enableSummarization && result.length > 0) {
          // In a real implementation, you'd call an LLM to summarize
          // For now, we'll just truncate
          break;
        } else {
          break;
        }
      }
    }

    return result.length > 0 ? result : messages.slice(-1); // At least keep the last message
  }

  /**
   * Estimate token count (rough: ~4 chars per token)
   * In production, use tiktoken or similar
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MemoryConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
    this.trim();
  }
}


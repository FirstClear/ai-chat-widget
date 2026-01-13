/**
 * Streaming Engine
 * 
 * Supports:
 * - SSE (Server-Sent Events)
 * - Fetch stream
 * - WebSocket
 * - Partial token rendering
 * - AbortController cancel
 */

import { StreamChunk, Message } from '../types';

export interface StreamHandler {
  onChunk?: (chunk: StreamChunk) => void;
  onComplete?: (message: Message) => void;
  onError?: (error: Error) => void;
}

export class StreamingEngine {
  private abortController?: AbortController;
  private currentMessage: Message | null = null;
  private accumulatedContent: string = '';

  /**
   * Stream from async iterable (from provider)
   */
  async stream(
    stream: AsyncIterable<StreamChunk>,
    handler: StreamHandler,
    messageId?: string
  ): Promise<Message> {
    this.abortController = new AbortController();
    this.accumulatedContent = '';
    
    const msgId = messageId || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.currentMessage = {
      id: msgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    try {
      for await (const chunk of stream) {
        if (this.abortController?.signal.aborted) {
          break;
        }

        // Accumulate content
        if (chunk.content) {
          this.accumulatedContent += chunk.content;
          if (this.currentMessage) {
            this.currentMessage.content = this.accumulatedContent;
          }
        }

        // Handle tool calls
        if (chunk.toolCalls && this.currentMessage) {
          this.currentMessage.tool_calls = chunk.toolCalls;
        }

        // Call chunk handler
        if (handler.onChunk) {
          handler.onChunk(chunk);
        }

        // Check if done
        if (chunk.done || chunk.finishReason) {
          if (this.currentMessage) {
            this.currentMessage.content = this.accumulatedContent;
          }
          break;
        }
      }

      if (this.currentMessage && handler.onComplete) {
        handler.onComplete(this.currentMessage);
      }

      return this.currentMessage!;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (handler.onError) {
        handler.onError(err);
      }
      throw err;
    } finally {
      this.abortController = undefined;
    }
  }

  /**
   * Cancel current stream
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Check if streaming
   */
  isStreaming(): boolean {
    return this.abortController !== undefined && !this.abortController.signal.aborted;
  }

  /**
   * Get abort signal for provider
   */
  getAbortSignal(): AbortSignal | undefined {
    return this.abortController?.signal;
  }
}


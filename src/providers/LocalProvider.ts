/**
 * Local LLM Provider Adapter (for localhost models like Ollama, LM Studio, etc.)
 */

import { BaseProvider } from './BaseProvider';
import { Message, ProviderConfig, ProviderResponse, StreamChunk } from '../types';

export class LocalProvider extends BaseProvider {
  name = 'local';

  async *stream(
    messages: Message[],
    config: ProviderConfig,
    signal?: AbortSignal
  ): AsyncIterable<StreamChunk> {
    // Default to OpenAI-compatible local endpoint
    const url = config.baseURL || 'http://localhost:11434/v1/chat/completions';
    
    const body = {
      model: config.model,
      messages: this.formatMessages(messages),
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens,
      top_p: config.topP,
      stream: true,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const error = await response.text().catch(() => 'Unknown error');
      throw new Error(`Local LLM API error: ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              yield { done: true };
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const choice = parsed.choices?.[0];
              
              if (choice?.delta?.content) {
                yield {
                  content: choice.delta.content,
                };
              }

              if (choice?.finish_reason) {
                yield {
                  finishReason: choice.finish_reason,
                  usage: parsed.usage,
                  done: true,
                };
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async chat(
    messages: Message[],
    config: ProviderConfig,
    signal?: AbortSignal
  ): Promise<ProviderResponse> {
    const url = config.baseURL || 'http://localhost:11434/v1/chat/completions';
    
    const body = {
      model: config.model,
      messages: this.formatMessages(messages),
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens,
      top_p: config.topP,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const error = await response.text().catch(() => 'Unknown error');
      throw new Error(`Local LLM API error: ${error}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    return {
      content: choice?.message?.content || '',
      usage: data.usage,
      finishReason: choice?.finish_reason,
    };
  }

  private formatMessages(messages: Message[]): any[] {
    return messages
      .filter((msg) => {
        // Filter out empty assistant messages
        if (msg.role === 'assistant' && (!msg.content || msg.content.trim() === '')) {
          return false;
        }
        // Ensure all messages have content (except system messages which can be empty)
        if (msg.role !== 'system') {
          return msg.content != null && msg.content !== '';
        }
        return true;
      })
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
        ...(msg.name && { name: msg.name }),
      }));
  }
}


/**
 * Moonshot Provider Adapter (OpenAI-compatible)
 */

import { BaseProvider } from './BaseProvider';
import { Message, ProviderConfig, ProviderResponse, StreamChunk } from '../types';

export class MoonshotProvider extends BaseProvider {
  name = 'moonshot';

  async *stream(
    messages: Message[],
    config: ProviderConfig,
    signal?: AbortSignal
  ): AsyncIterable<StreamChunk> {
    // Moonshot uses OpenAI-compatible API
    const url = config.baseURL || 'https://api.moonshot.cn/v1/chat/completions';
    
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
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Moonshot API error: ${JSON.stringify(error)}`);
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
    const url = config.baseURL || 'https://api.moonshot.cn/v1/chat/completions';
    
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
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Moonshot API error: ${JSON.stringify(error)}`);
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
        // Filter out empty assistant messages (Moonshot API doesn't allow them)
        if (msg.role === 'assistant' && (!msg.content || msg.content.trim() === '')) {
          return false;
        }
        // Ensure all messages have content
        return msg.content != null && msg.content !== '';
      })
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
        ...(msg.name && { name: msg.name }),
      }));
  }
}


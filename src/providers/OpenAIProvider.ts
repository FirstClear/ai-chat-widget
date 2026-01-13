/**
 * OpenAI Provider Adapter
 */

import { BaseProvider } from './BaseProvider';
import { Message, ProviderConfig, ProviderResponse, StreamChunk } from '../types';

export class OpenAIProvider extends BaseProvider {
  name = 'openai';

  async *stream(
    messages: Message[],
    config: ProviderConfig,
    signal?: AbortSignal
  ): AsyncIterable<StreamChunk> {
    const url = config.baseURL || 'https://api.openai.com/v1/chat/completions';
    
    const body = {
      model: config.model,
      messages: this.formatMessages(messages),
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens,
      top_p: config.topP,
      frequency_penalty: config.frequencyPenalty,
      presence_penalty: config.presencePenalty,
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
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
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

              if (choice?.delta?.tool_calls) {
                yield {
                  toolCalls: choice.delta.tool_calls,
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
    const url = config.baseURL || 'https://api.openai.com/v1/chat/completions';
    
    const body = {
      model: config.model,
      messages: this.formatMessages(messages),
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens,
      top_p: config.topP,
      frequency_penalty: config.frequencyPenalty,
      presence_penalty: config.presencePenalty,
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
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    return {
      content: choice?.message?.content || '',
      toolCalls: choice?.message?.tool_calls,
      usage: data.usage,
      finishReason: choice?.finish_reason,
    };
  }

  private formatMessages(messages: Message[]): any[] {
    return messages
      .filter((msg) => {
        // Filter out empty assistant messages (OpenAI API doesn't allow them)
        if (msg.role === 'assistant' && (!msg.content || msg.content.trim() === '')) {
          // Allow assistant messages with tool_calls even if content is empty
          return msg.tool_calls && msg.tool_calls.length > 0;
        }
        // Ensure all messages have content (except system messages which can be empty)
        if (msg.role !== 'system') {
          return msg.content != null && msg.content !== '';
        }
        return true;
      })
      .map((msg) => {
        const formatted: any = {
          role: msg.role,
          content: msg.content,
        };
        
        if (msg.name) {
          formatted.name = msg.name;
        }
        
        if (msg.tool_calls) {
          formatted.tool_calls = msg.tool_calls;
        }
        
        if (msg.tool_call_id) {
          formatted.tool_call_id = msg.tool_call_id;
        }

        return formatted;
      });
  }
}


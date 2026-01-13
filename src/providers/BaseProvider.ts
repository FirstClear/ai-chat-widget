/**
 * Base Provider Adapter
 */

import { Message, ProviderConfig, ProviderResponse, StreamChunk, ProviderAdapter } from '../types';

export abstract class BaseProvider implements ProviderAdapter {
  abstract name: string;

  abstract stream(
    messages: Message[],
    config: ProviderConfig,
    signal?: AbortSignal
  ): AsyncIterable<StreamChunk>;

  abstract chat(
    messages: Message[],
    config: ProviderConfig,
    signal?: AbortSignal
  ): Promise<ProviderResponse>;

  protected createMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}


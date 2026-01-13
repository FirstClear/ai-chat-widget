/**
 * ProviderHub - Multi-model Adapter Hub
 * 
 * Unified interface for:
 * - OpenAI
 * - Claude
 * - Moonshot
 * - Local LLM
 */

import { ProviderAdapter, ProviderConfig } from '../types';
import { OpenAIProvider } from './OpenAIProvider';
import { ClaudeProvider } from './ClaudeProvider';
import { MoonshotProvider } from './MoonshotProvider';
import { LocalProvider } from './LocalProvider';

export class ProviderHub {
  private providers: Map<string, ProviderAdapter> = new Map();

  constructor() {
    // Register default providers
    this.register(new OpenAIProvider());
    this.register(new ClaudeProvider());
    this.register(new MoonshotProvider());
    this.register(new LocalProvider());
  }

  /**
   * Register a custom provider
   */
  register(provider: ProviderAdapter): void {
    this.providers.set(provider.name, provider);
  }

  /**
   * Get provider by name
   */
  getProvider(name: string): ProviderAdapter {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider "${name}" not found. Available: ${Array.from(this.providers.keys()).join(', ')}`);
    }
    return provider;
  }

  /**
   * Get provider from config
   */
  getProviderFromConfig(config: ProviderConfig): ProviderAdapter {
    return this.getProvider(config.provider);
  }

  /**
   * List all registered providers
   */
  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}


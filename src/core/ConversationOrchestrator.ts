/**
 * Conversation Orchestrator - The Core Engine
 * 
 * Responsibilities:
 * - Unified entry point for all user messages
 * - Context management (calls Memory Window)
 * - Prompt composition (calls PromptEngine)
 * - Provider scheduling (selects model adapter)
 * - Stream distribution (controls token streaming)
 * - Plugin hooks (beforeSend / afterReceive)
 * 
 * This is a frontend-side mini-LLM runtime.
 */

import { Message, ProviderConfig, ChatPlugin, MemoryConfig, PluginContext } from '../types';
import { MemoryWindow } from './MemoryWindow';
import { PromptEngine } from './PromptEngine';
import { ProviderHub } from '../providers/ProviderHub';
import { StreamingEngine, StreamHandler } from './StreamingEngine';
import { PersistenceLayer } from '../storage/PersistenceLayer';

export interface OrchestratorConfig {
  provider: ProviderConfig;
  memory?: number | MemoryConfig;
  plugins?: ChatPlugin[];
  systemPrompt?: string;
  enablePersistence?: boolean;
  sessionId?: string;
}

export interface SendMessageOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (message: Message) => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
}

export class ConversationOrchestrator {
  private memoryWindow: MemoryWindow;
  private providerHub: ProviderHub;
  private streamingEngine: StreamingEngine;
  private persistenceLayer: PersistenceLayer;
  private config: OrchestratorConfig;
  private plugins: ChatPlugin[];

  constructor(config: OrchestratorConfig) {
    this.config = config;
    this.providerHub = new ProviderHub();
    this.streamingEngine = new StreamingEngine();
    this.persistenceLayer = new PersistenceLayer();
    
    // Initialize memory window
    const memoryConfig: MemoryConfig = typeof config.memory === 'number'
      ? { maxMessages: config.memory }
      : (config.memory || {});
    
    this.memoryWindow = new MemoryWindow(memoryConfig);
    
    // Set system prompt
    if (config.systemPrompt) {
      this.memoryWindow.setSystemPrompt(config.systemPrompt);
    }
    
    // Initialize plugins
    this.plugins = config.plugins || [];
    
    // Initialize persistence
    if (config.enablePersistence) {
      this.initializePersistence();
    }
  }

  /**
   * Send a message - unified entry point
   */
  async sendMessage(
    content: string,
    options: SendMessageOptions = {}
  ): Promise<Message> {
    const { onChunk, onComplete, onError, signal } = options;

    try {
      // 1. Create user message
      const userMessage: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'user',
        content,
        timestamp: Date.now(),
      };

      // 2. Add to memory window
      this.memoryWindow.addMessage(userMessage);

      // 3. Get context from memory window
      const context = this.memoryWindow.getContext();

      // 4. Compose prompt using PromptEngine
      const composedMessages = await PromptEngine.compose({
        systemPrompt: context.systemPrompt,
        messages: context.messages,
        plugins: this.plugins,
      });

      // 5. Format for provider
      const formattedMessages = PromptEngine.formatForProvider(
        composedMessages,
        this.config.provider.provider
      );

      // 6. Get provider adapter
      const provider = this.providerHub.getProviderFromConfig(this.config.provider);

      // 7. Create stream handler
      const streamHandler: StreamHandler = {
        onChunk: (chunk) => {
          if (chunk.content && onChunk) {
            onChunk(chunk.content);
          }
        },
        onComplete: async (message) => {
          // Apply plugin transformations
          let finalMessage = message;
          
          for (const plugin of this.plugins) {
            if (plugin.afterReceive) {
              const pluginContext: PluginContext = {
                messages: this.memoryWindow.getAllMessages(),
                systemPrompt: context.systemPrompt,
                metadata: {},
              };
              
              try {
                finalMessage = await this.applyPlugin(
                  plugin.afterReceive,
                  { ...pluginContext, response: finalMessage }
                );
              } catch (error) {
                console.warn(`Plugin ${plugin.name} afterReceive failed:`, error);
              }
            }
          }

          // Add assistant message to memory
          this.memoryWindow.addMessage(finalMessage);

          // Persist if enabled
          if (this.config.enablePersistence) {
            await this.persistConversation();
          }

          // Call completion handler
          if (onComplete) {
            onComplete(finalMessage);
          }
        },
        onError: (error) => {
          if (onError) {
            onError(error);
          }
        },
      };

      // 8. Stream response
      const abortSignal = signal || this.streamingEngine.getAbortSignal();
      const stream = provider.stream(formattedMessages, this.config.provider, abortSignal);
      
      const assistantMessage = await this.streamingEngine.stream(
        stream,
        streamHandler
      );

      return assistantMessage;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (onError) {
        onError(err);
      }
      throw err;
    }
  }

  /**
   * Cancel current request
   */
  cancel(): void {
    this.streamingEngine.cancel();
  }

  /**
   * Get conversation history
   */
  getHistory(): Message[] {
    return this.memoryWindow.getAllMessages();
  }

  /**
   * Clear conversation
   */
  clear(): void {
    this.memoryWindow.clear();
  }

  /**
   * Update system prompt
   */
  updateSystemPrompt(prompt: string): void {
    this.memoryWindow.setSystemPrompt(prompt);
  }

  /**
   * Pin messages
   */
  pinMessages(messages: Message[]): void {
    this.memoryWindow.pinMessages(messages);
  }

  /**
   * Add plugin
   */
  addPlugin(plugin: ChatPlugin): void {
    this.plugins.push(plugin);
  }

  /**
   * Remove plugin
   */
  removePlugin(pluginName: string): void {
    this.plugins = this.plugins.filter((p) => p.name !== pluginName);
  }

  /**
   * Apply plugin transformation
   */
  private async applyPlugin<T>(
    transform: (ctx: any) => Promise<T> | T,
    context: any
  ): Promise<T> {
    try {
      const result = await transform(context);
      return result || context;
    } catch (error) {
      console.warn('Plugin transformation failed:', error);
      return context;
    }
  }

  /**
   * Initialize persistence
   */
  private async initializePersistence(): Promise<void> {
    try {
      await this.persistenceLayer.init();
      
      // Load recent session if exists
      const recent = this.persistenceLayer.getRecentSession();
      if (recent && recent.messages.length > 0) {
        this.memoryWindow.addMessages(recent.messages);
      }
    } catch (error) {
      console.warn('Failed to initialize persistence:', error);
    }
  }

  /**
   * Persist conversation
   */
  private async persistConversation(): Promise<void> {
    try {
      const messages = this.memoryWindow.getAllMessages();
      const sessionId = this.config.sessionId || `session-${Date.now()}`;
      
      // Save to localStorage (recent)
      this.persistenceLayer.saveRecentSession(sessionId, messages);
      
      // Save to IndexedDB (long-term)
      await this.persistenceLayer.saveConversation({
        id: sessionId,
        messages,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.warn('Failed to persist conversation:', error);
    }
  }
}


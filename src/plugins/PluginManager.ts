/**
 * Plugin System
 * 
 * Interface:
 * - beforeSend: Transform messages before sending
 * - afterReceive: Transform response after receiving
 * - onToolCall: Handle tool calls
 */

import { ChatPlugin, Message, ToolCall, PluginContext } from '../types';

export class PluginManager {
  private plugins: Map<string, ChatPlugin> = new Map();

  /**
   * Register a plugin
   */
  register(plugin: ChatPlugin): void {
    this.plugins.set(plugin.name, plugin);
  }

  /**
   * Unregister a plugin
   */
  unregister(name: string): void {
    this.plugins.delete(name);
  }

  /**
   * Get all plugins
   */
  getAll(): ChatPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin by name
   */
  get(name: string): ChatPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Execute beforeSend hooks
   */
  async executeBeforeSend(ctx: PluginContext): Promise<PluginContext> {
    let result = ctx;
    
    for (const plugin of this.plugins.values()) {
      if (plugin.beforeSend) {
        try {
          result = await plugin.beforeSend(result);
        } catch (error) {
          console.warn(`Plugin ${plugin.name} beforeSend failed:`, error);
        }
      }
    }
    
    return result;
  }

  /**
   * Execute afterReceive hooks
   */
  async executeAfterReceive(
    message: Message,
    ctx: PluginContext
  ): Promise<Message> {
    let result = message;
    
    for (const plugin of this.plugins.values()) {
      if (plugin.afterReceive) {
        try {
          result = await plugin.afterReceive({ ...ctx, response: result });
        } catch (error) {
          console.warn(`Plugin ${plugin.name} afterReceive failed:`, error);
        }
      }
    }
    
    return result;
  }

  /**
   * Execute onToolCall hooks
   */
  async executeToolCall(
    toolCall: ToolCall,
    ctx: PluginContext
  ): Promise<any> {
    const results: any[] = [];
    
    for (const plugin of this.plugins.values()) {
      if (plugin.onToolCall) {
        try {
          const result = await plugin.onToolCall(toolCall, ctx);
          results.push(result);
        } catch (error) {
          console.warn(`Plugin ${plugin.name} onToolCall failed:`, error);
        }
      }
    }
    
    return results;
  }
}


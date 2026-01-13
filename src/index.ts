/**
 * Main entry point
 */

export { AIChatWidget } from './components/AIChatWidget';
export { ChatWindow } from './components/ChatWindow';
export { ConversationOrchestrator } from './core/ConversationOrchestrator';
export { MemoryWindow } from './core/MemoryWindow';
export { PromptEngine } from './core/PromptEngine';
export { StreamingEngine } from './core/StreamingEngine';
export { ProviderHub } from './providers/ProviderHub';
export { OpenAIProvider } from './providers/OpenAIProvider';
export { ClaudeProvider } from './providers/ClaudeProvider';
export { MoonshotProvider } from './providers/MoonshotProvider';
export { LocalProvider } from './providers/LocalProvider';
export { PersistenceLayer } from './storage/PersistenceLayer';
export { PluginManager } from './plugins/PluginManager';
export * from './types';


/**
 * AIChatWidget - Main Component (External API)
 * 
 * Ultra-simple API:
 * <AIChatWidget
 *   provider="openai"
 *   apiKey="sk-xxx"
 *   model="gpt-4.1-mini"
 *   system="You are a helpful assistant"
 *   memory={10}
 *   plugins={[searchPlugin]}
 * />
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ConversationOrchestrator } from '../core/ConversationOrchestrator';
import { ChatWindow } from './ChatWindow';
import { Message, AIChatWidgetProps, ProviderConfig } from '../types';

export const AIChatWidget: React.FC<AIChatWidgetProps> = ({
  provider,
  apiKey,
  baseURL,
  model,
  system,
  memory = 50,
  plugins = [],
  onMessage,
  onError,
  className = '',
  style,
}) => {
  const [orchestrator, setOrchestrator] = useState<ConversationOrchestrator | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize orchestrator
  useEffect(() => {
    const providerConfig: ProviderConfig = {
      provider,
      apiKey,
      baseURL,
      model,
    };

    const orchestratorInstance = new ConversationOrchestrator({
      provider: providerConfig,
      memory,
      plugins,
      systemPrompt: system,
      enablePersistence: true,
    });

    setOrchestrator(orchestratorInstance);
    
    // Load initial messages
    const history = orchestratorInstance.getHistory();
    setMessages(history);

    return () => {
      orchestratorInstance.cancel();
    };
  }, [provider, apiKey, baseURL, model, system, memory, plugins]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!orchestrator || isLoading) return;

      setIsLoading(true);

      try {
        // Add user message immediately
        const userMessage: Message = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          role: 'user',
          content,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMessage]);

        // Stream assistant response
        let assistantContent = '';
        const assistantMessage: Message = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        const response = await orchestrator.sendMessage(content, {
          onChunk: (chunk) => {
            assistantContent += chunk;
            setMessages((prev) => {
              const updated = [...prev];
              const lastMsg = updated[updated.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                lastMsg.content = assistantContent;
              }
              return updated;
            });
          },
          onComplete: (message) => {
            setMessages((prev) => {
              const updated = [...prev];
              const lastMsg = updated[updated.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                return [...updated.slice(0, -1), message];
              }
              return updated;
            });

            if (onMessage) {
              onMessage(message);
            }
          },
          onError: (error) => {
            console.error('Error sending message:', error);
            if (onError) {
              onError(error);
            }
          },
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('Failed to send message:', err);
        if (onError) {
          onError(err);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [orchestrator, isLoading, onMessage, onError]
  );

  if (!orchestrator) {
    return (
      <div className={`ai-chat-widget-loading ${className}`} style={style}>
        <p>Initializing...</p>
      </div>
    );
  }

  return (
    <div className={`ai-chat-widget-wrapper ${className}`} style={style}>
      <ChatWindow
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
};


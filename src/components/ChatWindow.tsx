/**
 * ChatWindow UI Component
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message } from '../types';
import { MarkdownContent } from './MarkdownContent';
import './ChatWindow.css';

export interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (content: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
  placeholder?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  onSendMessage,
  isLoading = false,
  className = '',
  placeholder = 'Type a message...',
}) => {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const prevMessagesLengthRef = useRef(messages.length);
  const prevLastMessageIdRef = useRef<string | undefined>(
    messages.length > 0 ? messages[messages.length - 1].id : undefined
  );

  useEffect(() => {
    // Only scroll when message count increases or the last message changes
    const currentLastMessageId = messages.length > 0 ? messages[messages.length - 1].id : undefined;
    const messagesLengthIncreased = messages.length > prevMessagesLengthRef.current;
    const lastMessageChanged = currentLastMessageId !== prevLastMessageIdRef.current;

    if (messagesLengthIncreased || lastMessageChanged) {
      scrollToBottom();
    }

    prevMessagesLengthRef.current = messages.length;
    prevLastMessageIdRef.current = currentLastMessageId;
  }, [messages, scrollToBottom]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isSending || isLoading) return;

    const content = input.trim();
    setInput('');
    setIsSending(true);

    try {
      await onSendMessage(content);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [input, isSending, isLoading, onSendMessage]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className={`ai-chat-widget ${className}`}>
      <div className="ai-chat-messages">
        {messages.length === 0 && (
          <div className="ai-chat-empty">
            <p>Start a conversation...</p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`ai-chat-message ai-chat-message-${message.role}`}
          >
            <div className="ai-chat-message-role">{message.role}</div>
            <div className="ai-chat-message-content">
              {message.role === 'assistant' ? (
                <MarkdownContent content={message.content} />
              ) : (
                <div className="ai-chat-plain-text">
                  {message.content.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < message.content.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
            {message.tool_calls && message.tool_calls.length > 0 && (
              <div className="ai-chat-tool-calls">
                {message.tool_calls.map((tool) => (
                  <div key={tool.id} className="ai-chat-tool-call">
                    <strong>{tool.function.name}</strong>
                    <pre>{tool.function.arguments}</pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {(isLoading || isSending) && (
          <div className="ai-chat-message ai-chat-message-assistant">
            <div className="ai-chat-message-role">assistant</div>
            <div className="ai-chat-message-content">
              <span className="ai-chat-typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="ai-chat-input-container">
        <textarea
          ref={inputRef}
          className="ai-chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          rows={1}
          disabled={isSending || isLoading}
        />
        <button
          className="ai-chat-send-button"
          onClick={handleSend}
          disabled={!input.trim() || isSending || isLoading}
        >
          Send
        </button>
      </div>
    </div>
  );
};


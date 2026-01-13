/**
 * Persistence Layer
 * 
 * Storage:
 * - localStorage: Recent sessions
 * - IndexedDB: Long-term sessions
 * - Plugin storage: Enterprise conversation retention
 */

import { Message } from '../types';

export interface ConversationSession {
  id: string;
  title?: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, any>;
}

export class PersistenceLayer {
  private dbName = 'ai-chat-widget';
  private dbVersion = 1;
  private storeName = 'conversations';
  private db: IDBDatabase | null = null;
  private localStorageKey = 'ai-chat-widget-recent';

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Save conversation to IndexedDB
   */
  async saveConversation(session: ConversationSession): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const updatedSession = {
        ...session,
        updatedAt: Date.now(),
      };

      const request = store.put(updatedSession);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get conversation from IndexedDB
   */
  async getConversation(id: string): Promise<ConversationSession | null> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result || null);
      };
    });
  }

  /**
   * List all conversations
   */
  async listConversations(limit?: number): Promise<ConversationSession[]> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        let sessions = request.result || [];
        sessions.sort((a, b) => b.updatedAt - a.updatedAt);
        if (limit) {
          sessions = sessions.slice(0, limit);
        }
        resolve(sessions);
      };
    });
  }

  /**
   * Delete conversation
   */
  async deleteConversation(id: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Save recent session to localStorage
   */
  saveRecentSession(sessionId: string, messages: Message[]): void {
    try {
      const recent = {
        sessionId,
        messages,
        timestamp: Date.now(),
      };
      localStorage.setItem(this.localStorageKey, JSON.stringify(recent));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  /**
   * Get recent session from localStorage
   */
  getRecentSession(): { sessionId: string; messages: Message[] } | null {
    try {
      const data = localStorage.getItem(this.localStorageKey);
      if (!data) return null;
      
      const recent = JSON.parse(data);
      // Expire after 7 days
      if (Date.now() - recent.timestamp > 7 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(this.localStorageKey);
        return null;
      }
      
      return {
        sessionId: recent.sessionId,
        messages: recent.messages || [],
      };
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return null;
    }
  }

  /**
   * Clear recent session
   */
  clearRecentSession(): void {
    localStorage.removeItem(this.localStorageKey);
  }

  /**
   * Export conversation as JSON
   */
  async exportConversation(id: string): Promise<string> {
    const session = await this.getConversation(id);
    if (!session) {
      throw new Error('Conversation not found');
    }
    return JSON.stringify(session, null, 2);
  }

  /**
   * Import conversation from JSON
   */
  async importConversation(json: string): Promise<ConversationSession> {
    const session = JSON.parse(json) as ConversationSession;
    await this.saveConversation(session);
    return session;
  }
}


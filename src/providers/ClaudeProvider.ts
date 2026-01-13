/**
 * Claude (Anthropic) Provider Adapter
 */

import { BaseProvider } from "./BaseProvider";
import {
  Message,
  ProviderConfig,
  ProviderResponse,
  StreamChunk,
} from "../types";

export class ClaudeProvider extends BaseProvider {
  name = "claude";

  async *stream(
    messages: Message[],
    config: ProviderConfig,
    signal?: AbortSignal
  ): AsyncIterable<StreamChunk> {
    const url =
      config.baseURL ||
      "https://api.anthropic.com/v1/messages/chat/completions";

    // Claude uses a different message format
    const formattedMessages = this.formatMessages(messages);
    const systemMessage = formattedMessages.find(
      (m: any) => m.role === "system"
    );
    const conversationMessages = formattedMessages.filter(
      (m: any) => m.role !== "system"
    );

    const body = {
      model: config.model,
      max_tokens: config.maxTokens ?? 4096,
      temperature: config.temperature ?? 0.7,
      top_p: config.topP,
      messages: conversationMessages,
      ...(systemMessage && { system: systemMessage.content }),
      stream: true,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(`Claude API error: ${JSON.stringify(error)}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              yield { done: true };
              return;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                yield {
                  content: parsed.delta.text,
                };
              }

              if (parsed.type === "message_stop") {
                yield {
                  finishReason: "stop",
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
    const url = config.baseURL || "https://api.anthropic.com/v1/messages";

    const formattedMessages = this.formatMessages(messages);
    const systemMessage = formattedMessages.find(
      (m: any) => m.role === "system"
    );
    const conversationMessages = formattedMessages.filter(
      (m: any) => m.role !== "system"
    );

    const body = {
      model: config.model,
      max_tokens: config.maxTokens ?? 4096,
      temperature: config.temperature ?? 0.7,
      top_p: config.topP,
      messages: conversationMessages,
      ...(systemMessage && { system: systemMessage.content }),
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(`Claude API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();

    return {
      content: data.content?.[0]?.text || "",
      usage: data.usage,
      finishReason: data.stop_reason === "end_turn" ? "stop" : undefined,
    };
  }

  private formatMessages(messages: Message[]): any[] {
    return messages
      .filter((msg) => {
        // Filter out empty assistant messages
        if (
          msg.role === "assistant" &&
          (!msg.content || msg.content.trim() === "")
        ) {
          return false;
        }
        // Ensure all messages have content (system messages can be empty, they'll be extracted separately)
        if (msg.role !== "system") {
          return msg.content != null && msg.content !== "";
        }
        return true;
      })
      .map((msg) => {
        // Claude doesn't use 'system' role in messages array
        if (msg.role === "system") {
          return {
            role: "user", // Will be extracted as system
            content: msg.content,
          };
        }

        return {
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        };
      });
  }
}

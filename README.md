# AI Chat Widget

<div align="center">

[![npm version](https://img.shields.io/npm/v/@kendent/ai-chat-widget.svg)](https://www.npmjs.com/package/@kendent/ai-chat-widget)
[![npm downloads](https://img.shields.io/npm/dm/@kendent/ai-chat-widget.svg)](https://www.npmjs.com/package/@kendent/ai-chat-widget)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Language / 语言**: [English](#english) | [中文](#中文)

</div>

---

<a name="english"></a>
## English

A plug-and-play, extensible, persistent, context-aware frontend conversation OS component.

### Features

- 🧠 **Smart Context Management** - Memory Window automatically manages conversation history with sliding window and token budget trimming
- 🔌 **Plugin Architecture** - Supports beforeSend / afterReceive / onToolCall hooks
- 🌐 **Multi-Model Support** - OpenAI, Claude, Moonshot, Local LLM
- ⚡ **Streaming Response** - Supports SSE / Fetch Stream with real-time token display
- 💾 **Persistence Storage** - localStorage (recent sessions) + IndexedDB (long-term sessions)
- 🎨 **Modern UI** - Clean and beautiful chat interface

### Project Structure

```
src/          # Source code
example/      # Example application
dist/         # Build output
```

- **Vite**: Unified build tool using Vite for both library and example
  - `yarn build` - Build library files
  - `yarn dev` - Run example application

### Quick Start

#### Installation

```bash
npm install @kendent/ai-chat-widget
```

#### Run Example

```bash
# After cloning the repository
yarn install
yarn dev  # Start example app, visit http://localhost:3000
```

#### Basic Usage

```tsx
import { AIChatWidget } from '@kendent/ai-chat-widget';
import '@kendent/ai-chat-widget/dist/style.css';

function App() {
  return (
    <AIChatWidget
      provider="openai"
      apiKey="sk-xxx"
      model="gpt-4"
      system="You are a helpful assistant"
      memory={50}
    />
  );
}
```

### API

#### AIChatWidget Props

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `provider` | `'openai' \| 'claude' \| 'moonshot' \| 'local'` | ✅ | Model provider |
| `apiKey` | `string` | ❌ | API key |
| `baseURL` | `string` | ❌ | Custom API endpoint |
| `model` | `string` | ✅ | Model name |
| `system` | `string` | ❌ | System prompt |
| `memory` | `number \| MemoryConfig` | ❌ | Context window configuration |
| `plugins` | `ChatPlugin[]` | ❌ | Plugin list |
| `onMessage` | `(message: Message) => void` | ❌ | Message callback |
| `onError` | `(error: Error) => void` | ❌ | Error callback |

#### MemoryConfig

```typescript
interface MemoryConfig {
  maxMessages?: number;      // Maximum message count (default: 50)
  maxTokens?: number;         // Maximum token count (default: 8000)
  enableSummarization?: boolean;  // Enable summarization compression
  systemPromptLocked?: boolean;   // Lock system prompt
}
```

### Plugin System

#### Create Plugin

```typescript
import { ChatPlugin } from '@kendent/ai-chat-widget';

const searchPlugin: ChatPlugin = {
  name: 'search',
  beforeSend: async (ctx) => {
    // Modify messages before sending
    return ctx;
  },
  afterReceive: async (ctx) => {
    // Process response after receiving
    return ctx.response;
  },
  onToolCall: async (tool, ctx) => {
    // Handle tool calls
    return result;
  },
};
```

#### Use Plugin

```tsx
<AIChatWidget
  provider="openai"
  apiKey="sk-xxx"
  model="gpt-4"
  plugins={[searchPlugin]}
/>
```

### Advanced Usage

#### Custom Provider

```typescript
import { BaseProvider, ProviderHub } from '@kendent/ai-chat-widget';

class CustomProvider extends BaseProvider {
  name = 'custom';
  
  async *stream(messages, config, signal) {
    // Implement streaming interface
  }
  
  async chat(messages, config, signal) {
    // Implement chat interface
  }
}

const hub = new ProviderHub();
hub.register(new CustomProvider());
```

#### Direct Usage of Orchestrator

```typescript
import { ConversationOrchestrator } from '@kendent/ai-chat-widget';

const orchestrator = new ConversationOrchestrator({
  provider: {
    provider: 'openai',
    apiKey: 'sk-xxx',
    model: 'gpt-4',
  },
  memory: 50,
  systemPrompt: 'You are a helpful assistant',
});

const response = await orchestrator.sendMessage('Hello!', {
  onChunk: (chunk) => console.log(chunk),
  onComplete: (message) => console.log(message),
});
```

### Architecture

```
┌───────────────┐
│   UI Layer    │
│ ChatWindow UI │
└───────┬───────┘
        │
┌───────▼───────┐
│ Conversation  │  ← Core Engine
│ Orchestrator  │
└───────┬───────┘
        │
┌───────┼───────┐
│       │       │
┌───▼───┐ ┌───▼───┐ ┌───▼───┐
│Memory │ │Prompt │ │Provider│
│Window │ │Engine │ │  Hub  │
└───────┘ └───────┘ └───────┘
```

### Supported Models

- **OpenAI**: GPT-4, GPT-3.5-turbo, etc.
- **Claude**: Claude 3 Opus, Sonnet, Haiku
- **Moonshot**: Moonshot-v1-8k, Moonshot-v1-32k
- **Local**: Ollama, LM Studio, etc. (OpenAI-compatible)

### License

MIT

---

<a name="中文"></a>
## 中文

一个即插即用、可扩展、可持久化、有上下文智能的前端对话操作系统组件。

### 特性

- 🧠 **智能上下文管理** - Memory Window 自动管理对话历史，支持滑动窗口和 Token 预算裁剪
- 🔌 **插件化架构** - 支持 beforeSend / afterReceive / onToolCall 钩子
- 🌐 **多模型支持** - OpenAI, Claude, Moonshot, Local LLM
- ⚡ **流式响应** - 支持 SSE / Fetch Stream，实时显示 token
- 💾 **持久化存储** - localStorage (最近会话) + IndexedDB (长期会话)
- 🎨 **现代化 UI** - 简洁美观的聊天界面

### 项目结构

```
src/          # 源代码
example/      # 示例应用
dist/         # 构建输出
```

- **Vite**: 统一使用 Vite 构建库和运行示例
  - `yarn build` - 构建库文件
  - `yarn dev` - 运行示例应用

### 快速开始

#### 安装

```bash
npm install @kendent/ai-chat-widget
```

#### 运行示例

```bash
# 克隆项目后
yarn install
yarn dev  # 启动示例应用，访问 http://localhost:3000
```

#### 基础用法

```tsx
import { AIChatWidget } from '@kendent/ai-chat-widget';
import '@kendent/ai-chat-widget/dist/style.css';

function App() {
  return (
    <AIChatWidget
      provider="openai"
      apiKey="sk-xxx"
      model="gpt-4"
      system="You are a helpful assistant"
      memory={50}
    />
  );
}
```

### API

#### AIChatWidget Props

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `provider` | `'openai' \| 'claude' \| 'moonshot' \| 'local'` | ✅ | 模型提供商 |
| `apiKey` | `string` | ❌ | API 密钥 |
| `baseURL` | `string` | ❌ | 自定义 API 地址 |
| `model` | `string` | ✅ | 模型名称 |
| `system` | `string` | ❌ | 系统提示词 |
| `memory` | `number \| MemoryConfig` | ❌ | 上下文窗口配置 |
| `plugins` | `ChatPlugin[]` | ❌ | 插件列表 |
| `onMessage` | `(message: Message) => void` | ❌ | 消息回调 |
| `onError` | `(error: Error) => void` | ❌ | 错误回调 |

#### MemoryConfig

```typescript
interface MemoryConfig {
  maxMessages?: number;      // 最大消息数 (默认: 50)
  maxTokens?: number;         // 最大 Token 数 (默认: 8000)
  enableSummarization?: boolean;  // 启用摘要压缩
  systemPromptLocked?: boolean;   // 锁定系统提示词
}
```

### 插件系统

#### 创建插件

```typescript
import { ChatPlugin } from '@kendent/ai-chat-widget';

const searchPlugin: ChatPlugin = {
  name: 'search',
  beforeSend: async (ctx) => {
    // 在发送前修改消息
    return ctx;
  },
  afterReceive: async (ctx) => {
    // 在接收后处理响应
    return ctx.response;
  },
  onToolCall: async (tool, ctx) => {
    // 处理工具调用
    return result;
  },
};
```

#### 使用插件

```tsx
<AIChatWidget
  provider="openai"
  apiKey="sk-xxx"
  model="gpt-4"
  plugins={[searchPlugin]}
/>
```

### 高级用法

#### 自定义 Provider

```typescript
import { BaseProvider, ProviderHub } from '@kendent/ai-chat-widget';

class CustomProvider extends BaseProvider {
  name = 'custom';
  
  async *stream(messages, config, signal) {
    // 实现流式接口
  }
  
  async chat(messages, config, signal) {
    // 实现聊天接口
  }
}

const hub = new ProviderHub();
hub.register(new CustomProvider());
```

#### 直接使用 Orchestrator

```typescript
import { ConversationOrchestrator } from '@kendent/ai-chat-widget';

const orchestrator = new ConversationOrchestrator({
  provider: {
    provider: 'openai',
    apiKey: 'sk-xxx',
    model: 'gpt-4',
  },
  memory: 50,
  systemPrompt: 'You are a helpful assistant',
});

const response = await orchestrator.sendMessage('Hello!', {
  onChunk: (chunk) => console.log(chunk),
  onComplete: (message) => console.log(message),
});
```

### 架构设计

```
┌───────────────┐
│   UI Layer    │
│ ChatWindow UI │
└───────┬───────┘
        │
┌───────▼───────┐
│ Conversation  │  ← 核心引擎
│ Orchestrator  │
└───────┬───────┘
        │
┌───────┼───────┐
│       │       │
┌───▼───┐ ┌───▼───┐ ┌───▼───┐
│Memory │ │Prompt │ │Provider│
│Window │ │Engine │ │  Hub  │
└───────┘ └───────┘ └───────┘
```

### 支持的模型

- **OpenAI**: GPT-4, GPT-3.5-turbo, etc.
- **Claude**: Claude 3 Opus, Sonnet, Haiku
- **Moonshot**: Moonshot-v1-8k, Moonshot-v1-32k
- **Local**: Ollama, LM Studio, etc. (OpenAI-compatible)

### 许可证

MIT

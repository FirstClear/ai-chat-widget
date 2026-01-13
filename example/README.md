# AI Chat Widget - Example

这是一个可以直接运行的示例应用，展示了如何使用 AI Chat Widget。

## 运行示例

```bash
# 安装依赖（如果还没安装）
yarn install

# 启动开发服务器
yarn dev
```

应用会在 `http://localhost:3000` 启动，并自动打开浏览器。

## 功能

- ✅ 切换不同的 Provider (OpenAI, Claude, Moonshot, Local)
- ✅ 配置 API Key 和 Model
- ✅ 自定义 System Prompt
- ✅ 启用/禁用插件
- ✅ 实时聊天界面
- ✅ 错误处理

## 配置说明

### OpenAI
- 需要 API Key: `sk-...`
- 默认 Model: `gpt-3.5-turbo`
- 其他模型: `gpt-4`, `gpt-4-turbo-preview` 等

### Claude
- 需要 API Key: `sk-ant-...`
- 默认 Model: `claude-3-haiku-20240307`
- 其他模型: `claude-3-opus-20240229`, `claude-3-sonnet-20240229` 等

### Moonshot
- 需要 API Key: `sk-...`
- 默认 Model: `moonshot-v1-8k`
- 其他模型: `moonshot-v1-32k` 等

### Local LLM
- 不需要 API Key
- 需要运行 Ollama 或类似的本地 LLM 服务
- 默认地址: `http://localhost:11434`
- 默认 Model: `llama2`

## 注意事项

1. **API Key 安全**: 示例中直接在前端输入 API Key，仅用于开发测试。生产环境应该使用后端代理。

2. **Local LLM**: 如果使用本地 LLM，确保服务正在运行：
   ```bash
   # 使用 Ollama
   ollama serve
   ```

3. **插件**: 启用日志插件后，可以在浏览器控制台查看消息发送和接收的日志。


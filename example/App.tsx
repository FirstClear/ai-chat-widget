import { useState } from "react";
import { AIChatWidget } from "../src/index";
import { ChatPlugin } from "../src/index";

// Example: Logging plugin
const loggingPlugin: ChatPlugin = {
  name: "logger",
  beforeSend: async (ctx) => {
    console.log("📤 Sending message:", ctx.messages);
    return ctx;
  },
  afterReceive: async (ctx) => {
    console.log("📥 Received response:", ctx.response);
    return ctx.response;
  },
};

function App() {
  const [provider, setProvider] = useState<
    "openai" | "claude" | "moonshot" | "local"
  >("openai");
  const [apiKey, setApiKey] = useState("");
  const [baseURL, setBaseURL] = useState("");
  const [model, setModel] = useState("gpt-3.5-turbo");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful assistant"
  );
  const [usePlugins, setUsePlugins] = useState(false);

  const providerConfigs = {
    openai: {
      model: "gpt-3.5-turbo",
      placeholder: "sk-...",
      baseURLPlaceholder: "https://api.openai.com/v1/chat/completions",
      defaultBaseURL: "https://api.openai.com/v1/chat/completions",
    },
    claude: {
      model: "claude-3-haiku-20240307",
      placeholder: "sk-ant-...",
      baseURLPlaceholder:
        "https://api.anthropic.com/v1/messages/chat/completions",
      defaultBaseURL: "https://api.anthropic.com/v1/messages/chat/completions",
    },
    moonshot: {
      model: "moonshot-v1-8k",
      placeholder: "sk-...",
      baseURLPlaceholder: "https://api.moonshot.cn/v1/chat/completions",
      defaultBaseURL: "https://api.moonshot.cn/v1/chat/completions",
    },
    local: {
      model: "llama2",
      placeholder: "Not needed for local",
      baseURLPlaceholder: "http://localhost:114514/v1/chat/completions",
      defaultBaseURL: "http://localhost:114514/v1/chat/completions",
    },
  };

  const currentConfig = providerConfigs[provider];

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>AI Chat Widget - Example</h1>

      <div
        style={{
          marginBottom: "20px",
          padding: "20px",
          background: "#f5f5f5",
          borderRadius: "8px",
        }}
      >
        <h2>Configuration</h2>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Provider:
          </label>
          <select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value as any);
              setModel(
                providerConfigs[e.target.value as keyof typeof providerConfigs]
                  .model
              );
              // Reset baseURL when switching providers
              setBaseURL("");
            }}
            style={{
              padding: "8px",
              width: "200px",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          >
            <option value="openai">OpenAI</option>
            <option value="claude">Claude</option>
            <option value="moonshot">Moonshot</option>
            <option value="local">Local LLM</option>
          </select>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Base URL:
          </label>
          <input
            type="text"
            value={baseURL}
            onChange={(e) => setBaseURL(e.target.value)}
            placeholder={currentConfig.baseURLPlaceholder}
            style={{
              padding: "8px",
              width: "400px",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          />
          <small style={{ display: "block", marginTop: "5px", color: "#666" }}>
            {provider === "local"
              ? "Optional: Defaults to http://localhost:11434/v1 if not specified"
              : "Optional: Uses default API endpoint if not specified"}
          </small>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            API Key:
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={currentConfig.placeholder}
            style={{
              padding: "8px",
              width: "400px",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          />
          <small style={{ display: "block", marginTop: "5px", color: "#666" }}>
            {provider === "local"
              ? "Not needed for local LLM"
              : "Enter your API key"}
          </small>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Model:
          </label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            style={{
              padding: "8px",
              width: "400px",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            System Prompt:
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={3}
            style={{
              padding: "8px",
              width: "400px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              fontFamily: "inherit",
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={usePlugins}
              onChange={(e) => setUsePlugins(e.target.checked)}
            />
            <span>Enable logging plugin</span>
          </label>
        </div>
      </div>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <AIChatWidget
          provider={provider}
          apiKey={apiKey || undefined}
          baseURL={baseURL || currentConfig.defaultBaseURL || undefined}
          model={model}
          system={systemPrompt}
          memory={50}
          plugins={usePlugins ? [loggingPlugin] : []}
          onMessage={(message) => {
            console.log("New message received:", message);
          }}
          onError={(error) => {
            console.error("Error:", error);
            alert(`Error: ${error.message}`);
          }}
          style={{ height: "600px" }}
        />
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          background: "#e3f2fd",
          borderRadius: "8px",
        }}
      >
        <h3>📝 Instructions:</h3>
        <ol>
          <li>Select your preferred provider</li>
          <li>Enter Base URL (optional, uses default if not specified)</li>
          <li>Enter your API key (if needed)</li>
          <li>Configure the model and system prompt</li>
          <li>Start chatting!</li>
          <li>Check the browser console for plugin logs (if enabled)</li>
        </ol>
        <p style={{ marginTop: "10px", color: "#666" }}>
          <strong>Note:</strong>
          <ul style={{ marginTop: "5px", paddingLeft: "20px" }}>
            <li>
              For local LLM, make sure you have Ollama or similar running on{" "}
              <code>http://localhost:11434</code>
            </li>
            <li>
              You can override the default Base URL for any provider by entering
              a custom endpoint
            </li>
            <li>
              Base URL should point to the API root (e.g.,{" "}
              <code>https://api.openai.com/v1</code>)
            </li>
          </ul>
        </p>
      </div>
    </div>
  );
}

export default App;

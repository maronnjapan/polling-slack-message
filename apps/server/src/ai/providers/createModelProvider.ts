import type { SecretProvider } from "../../secrets/secretProvider.js";
import type { AppConfig } from "../../config/appConfig.js";
import { MockProvider } from "./mockProvider.js";
import { OpenAiProvider } from "./openaiProvider.js";
import { AnthropicProvider } from "./anthropicProvider.js";
import { OpenRouterProvider } from "./openrouterProvider.js";
import { BedrockProvider } from "./bedrockProvider.js";
export type ModelProviderName = "openai" | "anthropic" | "openrouter" | "bedrock" | "mock";
export type GenerateInput = {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json";
};
export type GenerateOutput = { content: string; raw?: unknown };
export type ModelProvider = {
  name: ModelProviderName;
  configured(): Promise<boolean>;
  generate(input: GenerateInput): Promise<GenerateOutput>;
  generateObject?<T>(input: GenerateInput & { schema: unknown }): Promise<T>;
};
export function createModelProvider(config: AppConfig, secrets: SecretProvider): ModelProvider {
  switch (config.ai.provider) {
    case "openai":
      return new OpenAiProvider(config, secrets);
    case "anthropic":
      return new AnthropicProvider(config, secrets);
    case "openrouter":
      return new OpenRouterProvider(config, secrets);
    case "bedrock":
      return new BedrockProvider(config, secrets);
    default:
      return new MockProvider();
  }
}

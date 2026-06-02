import { generateObject, generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { AppConfig } from "../../config/appConfig.js";
import type { SecretProvider } from "../../secrets/secretProvider.js";
import type { GenerateInput, ModelProvider } from "./createModelProvider.js";
export class OpenRouterProvider implements ModelProvider {
  name = "openrouter" as const;
  constructor(
    private config: AppConfig,
    private secrets: SecretProvider,
  ) {}
  async configured() {
    return !!(await this.secrets.get("OPENROUTER_API_KEY"));
  }
  private async model() {
    const apiKey = await this.secrets.get("OPENROUTER_API_KEY");
    return createOpenRouter({ apiKey })(this.config.ai.model);
  }
  async generate(i: GenerateInput) {
    const { text } = await generateText({
      model: await this.model(),
      system: i.systemPrompt,
      prompt: i.userPrompt,
      temperature: i.temperature,
      maxOutputTokens: i.maxTokens,
    });
    return { content: text };
  }
  async generateObject<T>(i: GenerateInput & { schema: any }) {
    const { object } = await generateObject({
      model: await this.model(),
      schema: i.schema,
      system: i.systemPrompt,
      prompt: i.userPrompt,
      temperature: i.temperature,
      maxOutputTokens: i.maxTokens,
    });
    return object as T;
  }
}

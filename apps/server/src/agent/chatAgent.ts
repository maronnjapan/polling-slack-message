import type { DefaultLlmClient, InquiryChatInput } from "../ai/llmClient.js";
export class ChatAgent {
  constructor(private llm: DefaultLlmClient) {}
  chat(input: InquiryChatInput) {
    return this.llm.chat(input);
  }
}

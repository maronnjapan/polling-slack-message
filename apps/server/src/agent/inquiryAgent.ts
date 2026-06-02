import type { DefaultLlmClient, InquiryAnalysisInput } from "../ai/llmClient.js";
export class InquiryAgent {
  constructor(private llm: DefaultLlmClient) {}
  analyze(input: InquiryAnalysisInput) {
    return this.llm.analyzeInquiry(input);
  }
}

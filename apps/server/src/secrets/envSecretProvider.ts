import type { SecretProvider } from "./secretProvider.js";
export class EnvSecretProvider implements SecretProvider {
  async get(name: string) {
    return process.env[name];
  }
}

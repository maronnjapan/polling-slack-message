export type SecretProvider = { get(name: string): Promise<string | undefined> };

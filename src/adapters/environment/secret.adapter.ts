import { ISecretReadPort } from "../../ports/out/secret-read.port";

export class EnvironmentSecretAdapter implements ISecretReadPort {
  async read(secretName: string): Promise<string> {
    const value = process.env[secretName];
    if (!value) throw new Error(`Environment variable '${secretName}' is not set`);
    return value;
  }
}

export interface ISecretReadPort {
  read(secretName: string): Promise<string>;
}

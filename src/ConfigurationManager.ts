import type { ExtensionContext } from 'vscode';

export interface RunConfiguration {
  name: string;
  command: string;
  cwd?: string;
  source?: string;
}

export class ConfigurationManager {
  constructor(private ctx: ExtensionContext) {}
}

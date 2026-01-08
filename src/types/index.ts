import type { TaskGroup } from 'vscode';

export interface BaseNodeRunConfig {
  /**
   *  Configuration name
   *  @example "Dev Server"
   */
  name: string;
  /**
   * Select Package Manager
   * @default "npm"
   */
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun' | (string & {});

  args?: string[];

  taskGroup?:
    | string
    | {
        kind: keyof TaskGroup;
        isDefault: boolean;
      };

  presentation?: {
    reveal?: 'always' | 'silent' | 'never';
    group?: 'shared' | 'dedicated';
  };

  env: Record<string, string>;
}

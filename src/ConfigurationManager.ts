import * as vscode from 'vscode';
import { TaskManager } from './TaskManager';

export interface RunConfiguration {
  name: string;
  command: string;
  cwd?: string;
  source?: string;
}

export class ConfigurationManager {
  static readonly CONFIG_SECTION = 'runConfiguration';
  static readonly CONFIG_KEY = 'configurations';

  constructor() {}

  private getStoredConfigurations(): RunConfiguration[] {
    const config = vscode.workspace.getConfiguration(
      ConfigurationManager.CONFIG_SECTION
    );
    return config.get<RunConfiguration[]>(ConfigurationManager.CONFIG_KEY, []);
  }

  public async getConfigurations(): Promise<RunConfiguration[]> {
    const settingsConfigs = this.getStoredConfigurations();

    // Get tasks from workspace folders
    let taskConfigs: RunConfiguration[] = [];
    if (vscode.workspace.workspaceFolders) {
      for (const folder of vscode.workspace.workspaceFolders) {
        const tasks = await TaskManager.getWorkspaceTasks(folder.uri.fsPath);
        const mapped = tasks.map((t: any) => {
          let command = t.command;
          if (t.type === 'npm' && t.script) {
            command = `npm run ${t.script}`;
          }
          return {
            name: t.label,
            command: command || '',
            cwd: t.options?.cwd || folder.uri.fsPath,
            source: 'tasks.json',
          };
        });
        taskConfigs = taskConfigs.concat(mapped);
      }
    }

    return [...settingsConfigs, ...taskConfigs];
  }

  public async addConfiguration(newConfig: RunConfiguration): Promise<void> {
    const configs = this.getStoredConfigurations();
    // Check for duplicates by name? For now allow, or maybe warn.
    configs.push(newConfig);
    await this.updateConfigurations(configs);
  }

  public async removeConfiguration(name: string): Promise<void> {
    let configs = this.getStoredConfigurations();
    configs = configs.filter((c) => c.name !== name);
    await this.updateConfigurations(configs);
  }

  public async updateConfiguration(
    oldName: string,
    newConfig: RunConfiguration
  ): Promise<void> {
    let configs = this.getStoredConfigurations();
    const index = configs.findIndex((c) => c.name === oldName);
    if (index !== -1) {
      configs[index] = newConfig;
      await this.updateConfigurations(configs);
    }
  }

  private async updateConfigurations(
    configs: RunConfiguration[]
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration(
      ConfigurationManager.CONFIG_SECTION
    );
    // updates Global if no workspace, otherwise Workspace | Folder
    await config.update(
      ConfigurationManager.CONFIG_KEY,
      configs,
      vscode.ConfigurationTarget.Global
    );
  }
}

import type { ExtensionContext } from 'vscode';
import type { RunConfiguration } from '../ConfigurationManager';
import { SELECTED_CONFIG_KEY, WORKSPACE_KEY_CONTEXT } from './constants';

/**
 * Manages workspace-level state for run configurations.
 * Must be initialized once during extension activation.
 */
export class WorkspaceState {
  private ctx!: ExtensionContext;

  private configMap = new Map<string, RunConfiguration>();
  private currentConfigs: RunConfiguration[] = [];
  private selectedConfig?: RunConfiguration;

  /**
   * Initialize the workspace state.
   * Must be called exactly once in extension activation.
   */
  init(context: ExtensionContext): void {
    this.ctx = context;
    this.loadConfigs();
    this.selectedConfig = this.getSelectedConfig();
  }

  private loadConfigs(): void {
    this.configMap.clear();

    this.currentConfigs = this.ctx.workspaceState.get<RunConfiguration[]>(
      WORKSPACE_KEY_CONTEXT,
      [],
    );

    for (const config of this.currentConfigs) {
      this.configMap.set(config.name, config);
    }
  }

  getConfigs(): RunConfiguration[] {
    return this.currentConfigs;
  }

  addNewConfig(value: RunConfiguration): RunConfiguration[] {
    if (this.configMap.has(value.name)) {
      return this.currentConfigs;
    }

    this.currentConfigs = [...this.currentConfigs, value];
    this.persistConfigs();
    return this.currentConfigs;
  }

  removeConfig(configName: string): RunConfiguration[] {
    if (!this.configMap.has(configName)) {
      return this.currentConfigs;
    }

    this.currentConfigs = this.currentConfigs.filter((value) => value.name !== configName);

    if (this.selectedConfig?.name === configName) {
      this.changeSelectedConfig(undefined);
    }

    this.persistConfigs();
    return this.currentConfigs;
  }

  getSelectedConfig(): RunConfiguration | undefined {
    return this.ctx.workspaceState.get<RunConfiguration>(SELECTED_CONFIG_KEY);
  }

  changeSelectedConfig(value?: RunConfiguration): void {
    this.selectedConfig = value;
    this.ctx.workspaceState.update(SELECTED_CONFIG_KEY, value);
  }

  private persistConfigs(): void {
    this.ctx.workspaceState.update(WORKSPACE_KEY_CONTEXT, this.currentConfigs);
    this.loadConfigs();
  }
}

export const workspaceState = new WorkspaceState();

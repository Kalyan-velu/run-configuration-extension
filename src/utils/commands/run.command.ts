import { commands, Disposable, window, type ExtensionContext } from 'vscode';

import type { ConfigurationManager, RunConfiguration } from '../../ConfigurationManager';
import type { StatusBarManager } from '../../StatusBarManager';
import TaskManager from '../../TaskManager';
import {
  CREATE_FROM_COMMAND,
  MANAGE_CONFIG_COMMAND,
  RUN_CONFIG_COMMAND,
  SELECT_CONFIG_COMMAND,
} from '../constants';
import { workspaceState } from '../workspace-state';

export class RunCommands {
  private disposables: Disposable[] = [];
  private state = workspaceState;
  constructor(
    private ctx: ExtensionContext,
    private statusBarManager: StatusBarManager,
    private configManager: ConfigurationManager,
  ) {
    this.disposables = this.register();
    this.ctx.subscriptions.push(...this.disposables, statusBarManager);
  }
  private register() {
    return [
      commands.registerCommand(RUN_CONFIG_COMMAND, this.handleRun),
      commands.registerCommand(SELECT_CONFIG_COMMAND, this.handleSelect),
      commands.registerCommand(MANAGE_CONFIG_COMMAND, this.handleManage),
      commands.registerCommand(CREATE_FROM_COMMAND, this.createFromScript),
    ];
  }
  _dispose = () => {
    if (this.disposables.length) {
      return;
    }
    this.disposables.forEach((d) => d.dispose());
  };
  private handleRun = () => {
    //
    const configToRun: RunConfiguration | undefined = this.state.getSelectedConfig();
    if (configToRun) {
      this.statusBarManager?.update(this.state.getSelectedConfig());
    }
    if (!configToRun) {
      window.showWarningMessage('Select an configuration to run.');
      return;
    }

    window.showInformationMessage(`Starting ${configToRun?.command}.`);
    const terminal = window.createTerminal(configToRun?.command);
    if (configToRun.command) {
      terminal.sendText(configToRun.command);
    }
  };
  private handleSelect = async (configs: RunConfiguration[] = []) => {
    if (configs.length === 0) {
      window.showInformationMessage(
        'No configurations found. Add one via "Run Configuration: Manage".',
      );
      return;
    }

    const items = configs.map((c) => ({
      label: c.name,
      description: c.command + (c.source ? ` (${c.source})` : ''),
      config: c,
    }));

    const selected = await window.showQuickPick(items, {
      placeHolder: 'Select a Run Configuration',
    });

    if (selected) {
      this.statusBarManager.update(selected.config);
    }
  };
  private handleManage = async () => {
    // ConfigEditorPanel.createOrShow(this.ctx.extensionUri);
  };
  private createFromScript = async (name: string, command: string, cwd: string) => {
    try {
      await TaskManager.addNpmScriptTask(cwd, name);
    } catch (e) {
      console.error('Failed to write tasks.json:', e);
    }
    window.showInformationMessage(`Configuration '${name}' added.`);
  };
}

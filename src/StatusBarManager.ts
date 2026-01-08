import * as vscode from 'vscode';
import type { RunConfiguration } from './ConfigurationManager';
import { RUN_CONFIG_COMMAND, SELECT_CONFIG_COMMAND } from './utils/constants';
import { workspaceState } from './utils/workspace-state';

export class StatusBarManager {
  private state = workspaceState;
  private runButton: vscode.StatusBarItem;
  private configSelector: vscode.StatusBarItem;

  constructor(private ctx?: vscode.ExtensionContext) {
    this.runButton = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.runButton.command = RUN_CONFIG_COMMAND;
    this.runButton.text = '$(play)';
    this.runButton.tooltip = 'Run Configuration';

    this.configSelector = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      99
    );
    this.configSelector.command = SELECT_CONFIG_COMMAND;
    this.configSelector.tooltip = 'Select Run Configuration';

    this.update(workspaceState.getSelectedConfig());
  }

  public update(config?: RunConfiguration) {
    if (config) {
      this.configSelector.text = `$(gear) ${config.name}`;
      this.runButton.show();
      this.configSelector.show();
      this.state.changeSelectedConfig(config);
    } else {
      this.configSelector.text = '$(gear) Select Script';
      this.runButton.hide(); // Hide run button if nothing selected
      this.configSelector.show();
    }
  }

  public dispose() {
    this.runButton.dispose();
    this.configSelector.dispose();
  }
}

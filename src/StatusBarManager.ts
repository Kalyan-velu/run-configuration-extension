import * as vscode from 'vscode';
import type { RunConfiguration } from './ConfigurationManager';

export class StatusBarManager {
  private runButton: vscode.StatusBarItem;
  private configSelector: vscode.StatusBarItem;

  constructor(private ctx?: vscode.ExtensionContext) {
    this.runButton = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.runButton.command = 'run-configuration.run';
    this.runButton.text = '$(play)';
    this.runButton.tooltip = 'Run Configuration';

    this.configSelector = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      99
    );
    this.configSelector.command = 'run-configuration.select';
    this.configSelector.tooltip = 'Select Run Configuration';

    this.update();
  }

  public update(config?: RunConfiguration) {
    if (config) {
      this.configSelector.text = `$(gear) ${config.name}`;
      this.runButton.show();
      this.configSelector.show();
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

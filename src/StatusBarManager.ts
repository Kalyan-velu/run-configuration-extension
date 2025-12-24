import * as vscode from 'vscode';

export class StatusBarManager {
  private runButton: vscode.StatusBarItem;
  private configSelector: vscode.StatusBarItem;

  constructor() {
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

    // Initial State
    this.update('No Config');
  }

  public update(configName: string | undefined) {
    if (configName) {
      this.configSelector.text = `$(gear) ${configName}`;
      this.runButton.show();
      this.configSelector.show();
    } else {
      this.configSelector.text = '$(gear) No Configuration';
      this.runButton.hide(); // Hide run button if nothing selected
      this.configSelector.show();
    }
  }

  public dispose() {
    this.runButton.dispose();
    this.configSelector.dispose();
  }
}

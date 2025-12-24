import * as vscode from 'vscode';
import { ConfigurationManager } from './ConfigurationManager';

export class ConfigEditorPanel {
  public static currentPanel: ConfigEditorPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _configManager: ConfigurationManager;

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (ConfigEditorPanel.currentPanel) {
      ConfigEditorPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'runConfigEditor',
      'Manage Run Configurations',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
      }
    );

    ConfigEditorPanel.currentPanel = new ConfigEditorPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._configManager = new ConfigurationManager();

    this._update();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'saveConfig':
            await this._configManager.addConfiguration(message.config);
            await this._update();
            vscode.window.showInformationMessage('Configuration Saved');
            vscode.commands.executeCommand(
              'run-configuration.run',
              message.config
            );
            return;
          case 'deleteConfig':
            await this._configManager.removeConfiguration(message.name);
            await this._update();
            vscode.window.showInformationMessage('Configuration Deleted');
            return;
        }
      },
      null,
      this._disposables
    );
  }

  public dispose() {
    ConfigEditorPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private async _update() {
    const webview = this._panel.webview;
    this._panel.title = 'Manage Run Configurations';
    const configs = await this._configManager.getConfigurations();
    webview.html = this._getHtmlForWebview(webview, configs);
  }

  private _getHtmlForWebview(webview: vscode.Webview, configs: any[]) {
    // Simple HTML/JS for now. In a real app, maybe use React or Svelte bundled.
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Run Configurations</title>
    <style>
        body { font-family: var(--vscode-font-family); color: var(--vscode-editor-foreground); padding: 20px; }
        .config-list { margin-bottom: 20px; }
        .config-item { border: 1px solid var(--vscode-panel-border); padding: 10px; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center; }
        .form { border-top: 1px solid var(--vscode-panel-border); padding-top: 20px; }
        input { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); padding: 5px; width: 100%; margin-bottom: 10px; }
        button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); padding: 8px 15px; border: none; cursor: pointer; }
        button:hover { background: var(--vscode-button-hoverBackground); }
        .delete-btn { background: var(--vscode-errorForeground); }
    </style>
</head>
<body>
    <h2>Current Configurations</h2>
    <div class="config-list">
        ${
          configs.length === 0
            ? '<p>No configurations found.</p>'
            : configs
                .map(
                  (c) => `
            <div class="config-item">
                <div>
                    <strong>${c.name}</strong> ${
                    c.source ? `<small>(${c.source})</small>` : ''
                  }<br>
                    <small>${c.command}</small><br>
                    <small>CWD: ${c.cwd || 'Root'}</small>
                </div>
                ${
                  c.source === 'tasks.json'
                    ? '<span>(Read-only)</span>'
                    : `<button class="delete-btn" onclick="deleteConfig('${c.name}')">Delete</button>`
                }
            </div>
        `
                )
                .join('')
        }
    </div>

    <h2>Add New Configuration</h2>
    <div class="form">
        <label>Name</label>
        <input type="text" id="name" placeholder="Run Config Name">
        
        <label>Command</label>
        <input type="text" id="command" placeholder="echo 'Hello World'">
        
        <label>CWD (Optional)</label>
        <input type="text" id="cwd" placeholder="/path/to/cwd">
        
        <button onclick="saveConfig()">Save Configuration</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function saveConfig() {
            const name = document.getElementById('name').value;
            const command = document.getElementById('command').value;
            const cwd = document.getElementById('cwd').value;

            if (!name || !command) {
                return;
            }

            vscode.postMessage({
                command: 'saveConfig',
                config: { name, command, cwd }
            });
        }

        function deleteConfig(name) {
            vscode.postMessage({
                command: 'deleteConfig',
                name: name
            });
        }
    </script>
</body>
</html>`;
  }
}

import * as vscode from 'vscode';
import { ConfigEditorPanel } from './ConfigEditorPanel';
import { ConfigurationManager, RunConfiguration } from './ConfigurationManager';
import { PackageJsonCodeLensProvider } from './PackageJsonCodeLensProvider';
import { StatusBarManager } from './StatusBarManager';
import { TaskManager } from './TaskManager';
import { workspaceState } from './utils/workspace-state';

export function activate(context: vscode.ExtensionContext) {
  workspaceState.init(context);
  const configManager = new ConfigurationManager();
  const statusBar = new StatusBarManager();

  const updateStatusBar = (config?: RunConfiguration | undefined) => {
    statusBar.update(config ?? workspaceState.getSelectedConfig());
  };
  updateStatusBar(workspaceState.getSelectedConfig());

  // Command: Select Configuration
  const selectCommand = vscode.commands.registerCommand(
    'run-configuration.select',
    async () => {
      const configs = await configManager.getConfigurations();
      if (configs.length === 0) {
        vscode.window.showInformationMessage(
          'No configurations found. Add one via "Run Configuration: Manage".'
        );
        return;
      }

      const items = configs.map((c) => ({
        label: c.name,
        description: c.command + (c.source ? ` (${c.source})` : ''),
        config: c,
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a Run Configuration',
      });

      if (selected) {
        updateStatusBar(selected.config);
      }
    }
  );

  // Command: Run Configuration
  const runCommand = vscode.commands.registerCommand(
    'run-configuration.run',
    (config?: RunConfiguration) => {
      if (config) {
        updateStatusBar(config);
      }

      const selectedConfig = workspaceState.getSelectedConfig();
      if (!selectedConfig) {
        vscode.window.showWarningMessage('No configuration selected.');
        return;
      }

      const terminal = vscode.window.createTerminal(
        `Run: ${selectedConfig.name}`
      );
      terminal.show();
      if (selectedConfig.cwd) {
        terminal.sendText(`cd "${selectedConfig.cwd}"`);
      }
      terminal.sendText(selectedConfig.command);
    }
  );

  // Command: Manage Configurations (Placeholder for now, opens Webview later)
  const manageCommand = vscode.commands.registerCommand(
    'run-configuration.manage',
    () => {
      ConfigEditorPanel.createOrShow(context.extensionUri);
    }
  );

  // Command: Create from Script
  const createFromScriptCommand = vscode.commands.registerCommand(
    'run-configuration.createFromScript',
    async (name: string, command: string, cwd: string) => {
      await configManager.addConfiguration({ name, command, cwd });
      // Also create a corresponding task entry in .vscode/tasks.json when possible
      try {
        // The PackageJsonCodeLensProvider passes script name as `name` and cwd as folder path
        await TaskManager.addNpmScriptTask(cwd, name);
      } catch (e) {
        // non-fatal
        console.error('Failed to write tasks.json:', e);
      }
      vscode.window.showInformationMessage(`Configuration '${name}' added.`);
      updateStatusBar(); // Refresh if needed, though addConfiguration updates settings which fires unrelated events usually.
    }
  );

  const codeLensProvider = vscode.languages.registerCodeLensProvider(
    { language: 'json', pattern: '**/package.json' },
    new PackageJsonCodeLensProvider()
  );

  context.subscriptions.push(
    selectCommand,
    runCommand,
    manageCommand,
    createFromScriptCommand,
    codeLensProvider,
    statusBar
  );
}

export function deactivate() {}

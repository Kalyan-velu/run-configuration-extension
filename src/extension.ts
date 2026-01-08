import * as vscode from 'vscode';
import { ConfigEditorPanel } from './ConfigEditorPanel';
import { ConfigurationManager, RunConfiguration } from './ConfigurationManager';
import { PackageJsonCodeLensProvider } from './PackageJsonCodeLensProvider';
import { StatusBarManager } from './StatusBarManager';
import { TaskManager } from './TaskManager';
import { RunCommands } from './utils/commands/run.command';
import { CREATE_FROM_COMMAND, SELECT_CONFIG_COMMAND } from './utils/constants';
import { workspaceState } from './utils/workspace-state';

export function activate(context: vscode.ExtensionContext) {
  workspaceState.init(context);
  const configManager = new ConfigurationManager();
  const statusBar = new StatusBarManager();
  const run = new RunCommands(context, statusBar).init();

  const updateStatusBar = (config?: RunConfiguration | undefined) => {
    statusBar.update(config ?? workspaceState.getSelectedConfig());
  };
  updateStatusBar(workspaceState.getSelectedConfig());

  // Command: Select Configuration
  const selectCommand = vscode.commands.registerCommand(
    SELECT_CONFIG_COMMAND,
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

  // Command: Manage Configurations (Placeholder for now, opens Webview later)
  const manageCommand = vscode.commands.registerCommand(
    'run-configuration.manage',
    () => {
      ConfigEditorPanel.createOrShow(context.extensionUri);
    }
  );

  // Command: Create from Script
  const createFromScriptCommand = vscode.commands.registerCommand(
    CREATE_FROM_COMMAND,
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
    run,
    manageCommand,
    createFromScriptCommand,
    codeLensProvider,
    statusBar
  );
}

export function deactivate() {}

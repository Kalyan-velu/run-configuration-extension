import * as vscode from 'vscode';
import { ConfigurationManager } from './ConfigurationManager';
import { PackageJsonCodeLensProvider } from './PackageJsonCodeLensProvider';
import { StatusBarManager } from './StatusBarManager';
import { RunCommands } from './utils/commands/run.command';
import { workspaceState } from './utils/workspace-state';

export function activate(context: vscode.ExtensionContext) {
  workspaceState.init(context);
  new RunCommands(context, new StatusBarManager(context), new ConfigurationManager(context));

  const codeLensProvider = vscode.languages.registerCodeLensProvider(
    { language: 'json', pattern: '**/package.json' },
    new PackageJsonCodeLensProvider(),
  );

  context.subscriptions.push(codeLensProvider);
}

export function deactivate() {}

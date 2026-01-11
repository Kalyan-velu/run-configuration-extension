import * as vscode from 'vscode';
import { ConfigurationManager } from './ConfigurationManager';
import { StatusBarManager } from './StatusBarManager';
import { getNodeScripts } from './task-providers/node/node-task.provider';
import { RunCommands } from './utils/commands/run.command';
import { workspaceState } from './utils/workspace-state';

let commands: RunCommands;
export async function activate(context: vscode.ExtensionContext) {
  const workspaceRoot =
    vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;
  if (!workspaceRoot) {
    return;
  }
  workspaceState.init(context);
  const tasks = await getNodeScripts();
  console.log(tasks.scripts);
  commands = new RunCommands(
    context,
    new StatusBarManager(context),
    new ConfigurationManager(context),
  );
}

export function deactivate() {
  commands._dispose();
}

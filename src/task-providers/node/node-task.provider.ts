import path from 'path';
import {
  ShellExecution,
  Task,
  TaskGroup,
  TaskScope,
  Uri,
  workspace,
  type CancellationToken,
  type ProviderResult,
  type TaskDefinition,
  type TaskProvider,
} from 'vscode';
import { exists } from '../rake/rake-task-provider';
import { detectNodePackageManager } from './detect-manager';

export class NodeTaskProvider implements TaskProvider {
  private nodeTasksPromise: Thenable<Results> | undefined = undefined;
  constructor(workspaceRoot: string) {
    const pattern = path.join(workspaceRoot, '**/package.json');
    const fileWatcher = workspace.createFileSystemWatcher(pattern);
  }
  provideTasks(token: CancellationToken): ProviderResult<Task[]> {
    throw new Error('Method not implemented.');
  }
  resolveTask(task: Task, token: CancellationToken): ProviderResult<Task> {
    throw new Error('Method not implemented.');
  }
}
interface Results {
  scripts: Record<string, string>;
  tasks: Task[];
}

interface NodeTaskDefination extends TaskDefinition {
  name: string;
  script?: string;
  file?: string;
}

export async function getNodeScripts(): Promise<Results> {
  const workspaceFolders = workspace.workspaceFolders;
  let results: Results = {
    scripts: {},
    tasks: [],
  };
  const tasks: Task[] = [];
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return results;
  }
  for (const workspaceFolder of workspaceFolders) {
    const folderPath = workspaceFolder.uri.fsPath;
    if (!folderPath) {
      continue;
    }
    // Loaad and Read PackageJson
    const packageJsonFile = path.join(folderPath, 'package.json');

    if (!(await exists(packageJsonFile))) {
      continue;
    }
    const fileUri = Uri.file(packageJsonFile);
    const doc = await workspace.openTextDocument(fileUri);
    const content = doc.getText();
    const packageJson = JSON.parse(content);
    const scripts = packageJson.scripts as Record<string, string>;
    const packageManager = await detectNodePackageManager(workspaceFolder);
    if (scripts && Object.keys(scripts).length > 0) {
      results.scripts = { ...results.scripts, ...scripts };
      Object.entries(scripts).forEach(([key, value]) => {
        const kind: NodeTaskDefination = {
          type: packageManager.packageManager,
          name: key,
          script: value,
          file: packageManager.folder.fsPath,
        };
        const task = new Task(
          kind,
          TaskScope.Workspace,
          key,
          value,
          new ShellExecution(`${packageManager.packageManager} run ${value}`),
        );
        // TODO - Implement task group check
        task.group = TaskGroup.Build;
        tasks.push(task);
      });
    }
  }
  // create task from each script

  return {
    ...results,
    tasks,
  };
}

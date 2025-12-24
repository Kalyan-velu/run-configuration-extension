import * as path from 'path';
import * as vscode from 'vscode';

function stripJsonComments(text: string): string {
  // Remove // line comments
  let out = text.replace(/(^|\n)\s*\/\/.*(?=\n|$)/g, '\n');
  // Remove /* ... */ block comments
  out = out.replace(/\/\*[\s\S]*?\*\//g, '');
  return out;
}

export class TaskManager {
  static async addNpmScriptTask(
    workspaceFolder: string,
    scriptName: string
  ): Promise<void> {
    const vscodeDir = path.join(workspaceFolder, '.vscode');
    const tasksPath = path.join(vscodeDir, 'tasks.json');
    const tasksUri = vscode.Uri.file(tasksPath);

    try {
      await vscode.workspace.fs.createDirectory(vscode.Uri.file(vscodeDir));
    } catch (e) {
      // ignore
    }

    let tasksObj: any = { version: '2.0.0', tasks: [] };

    try {
      const doc = await vscode.workspace.openTextDocument(tasksUri);
      const text = doc.getText();
      const stripped = stripJsonComments(text);
      tasksObj = JSON.parse(stripped);
      if (!tasksObj.tasks) {
        tasksObj.tasks = [];
      }
    } catch (err) {
      // If file doesn't exist or parse failed, start fresh
      tasksObj = { version: '2.0.0', tasks: [] };
    }

    const label = `npm: ${scriptName}`;

    // Avoid duplicates by label
    const exists = tasksObj.tasks.some((t: any) => t.label === label);
    if (exists) {
      return;
    }

    const task: any = {
      type: 'npm',
      script: scriptName,
      label,
      presentation: {
        group: 'watch',
        reveal: 'never',
      },
    };

    // Heuristics for grouping and problemMatcher
    if (/watch/i.test(scriptName)) {
      task.isBackground = true;
      task.group = 'build';
    }

    if (/esbuild/i.test(scriptName)) {
      task.group = 'build';
      task.problemMatcher = {
        owner: 'esbuild',
        fileLocation: ['relative', '${workspaceFolder}'],
        pattern: [
          { regexp: '^✘ \\[ERROR\\] (.*)$', message: 1 },
          { regexp: '^\\s*(.*):(\\d+):(\\d+):$', file: 1, line: 2, column: 3 },
        ],
        background: {
          activeOnStart: true,
          beginsPattern: '^\\[watch\\] build started$',
          endsPattern: '^\\[watch\\] build finished$',
        },
      };
      task.presentation = { group: 'watch', reveal: 'never' };
    } else if (/tsc/i.test(scriptName)) {
      task.group = 'build';
      task.problemMatcher = '$tsc-watch';
      task.isBackground = true;
      task.presentation = { group: 'watch', reveal: 'never' };
    }

    tasksObj.tasks.push(task);

    const writeText = JSON.stringify(tasksObj, null, 4);
    const writeData = Buffer.from(writeText, 'utf8');
    await vscode.workspace.fs.writeFile(tasksUri, writeData);
  }

  static async getWorkspaceTasks(workspaceFolder: string): Promise<any[]> {
    const tasksPath = path.join(workspaceFolder, '.vscode', 'tasks.json');
    const tasksUri = vscode.Uri.file(tasksPath);
    try {
      const doc = await vscode.workspace.openTextDocument(tasksUri);
      const text = doc.getText();
      const stripped = stripJsonComments(text);
      const tasksObj = JSON.parse(stripped);
      return Array.isArray(tasksObj.tasks) ? tasksObj.tasks : [];
    } catch (e) {
      return [];
    }
  }
}

export default TaskManager;

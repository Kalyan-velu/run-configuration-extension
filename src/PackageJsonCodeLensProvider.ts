import * as path from 'path';
import * as vscode from 'vscode';
import { CREATE_FROM_COMMAND } from './utils/constants';

export class PackageJsonCodeLensProvider implements vscode.CodeLensProvider {
  public provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    if (!document.fileName.endsWith('package.json')) {
      return [];
    }
    return this.scanLines(document);
  }

  private scanLines(document: vscode.TextDocument): vscode.CodeLens[] {
    const lenses: vscode.CodeLens[] = [];
    const text = document.getText();
    const lines = text.split('\n');

    let inScripts = false;
    let scriptBlockIndent = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!inScripts) {
        if (/"scripts"\s*:\s*{/.test(trimmed)) {
          inScripts = true;
          // Try to guess indentation to find the closing brace
          const match = line.match(/^(\s*)"scripts"/);
          if (match) {
            scriptBlockIndent = match[1].length;
          }
        }
      } else {
        // We are in scripts
        // Check for end of block: line with just '}' or '},' with same indentation
        if (
          trimmed.startsWith('}') &&
          (scriptBlockIndent === -1 || line.indexOf('}') === scriptBlockIndent)
        ) {
          inScripts = false;
          continue;
        }

        // Match script line: "name": "command"
        const scriptMatch = /"([^"]+)"\s*:\s*"(.*)"/.exec(trimmed);
        if (scriptMatch) {
          const scriptName = scriptMatch[1];
          const range = new vscode.Range(i, 0, i, line.length);
          const cwd = path.dirname(document.uri.fsPath); // Use fsPath for consistency

          const cmd: vscode.Command = {
            title: 'Run',
            tooltip: `Create Run Configuration for 'npm run ${scriptName}'`,
            command: CREATE_FROM_COMMAND,
            arguments: [scriptName, `npm run ${scriptName}`, cwd],
          };

          lenses.push(new vscode.CodeLens(range, cmd));
        }
      }
    }
    return lenses;
  }
}

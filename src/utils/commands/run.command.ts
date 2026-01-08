import { commands, window, type ExtensionContext } from 'vscode';
import type { RunConfiguration } from '../../ConfigurationManager';
import type { StatusBarManager } from '../../StatusBarManager';
import { RUN_CONFIG_COMMAND } from '../constants';
import { workspaceState } from '../workspace-state';

export class RunCommands {
  private state = workspaceState;
  constructor(
    private ctx?: ExtensionContext,
    private statusBarManager?: StatusBarManager
  ) {}
  init() {
    return commands.registerCommand(
      RUN_CONFIG_COMMAND,
      (config?: RunConfiguration) => {
        let configToRun: RunConfiguration | undefined = config;
        if (configToRun) {
          this.statusBarManager?.update(config);
        } else if (this.state.getSelectedConfig()) {
          configToRun = this.state.getSelectedConfig();
          this.statusBarManager?.update(this.state.getSelectedConfig());
        }
        if (!configToRun) {
          window.showWarningMessage('Select an configuration to run.');
          return;
        }

        window.showInformationMessage(`Starting ${configToRun?.command}.`);
        const terminal = window.createTerminal(configToRun?.command);
        if (configToRun.command) {
          terminal.sendText(configToRun.command);
        }
      }
    );
  }
}

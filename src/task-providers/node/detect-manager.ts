import path from 'path';
import { Uri, type WorkspaceFolder } from 'vscode';
import { exists } from '../rake/rake-task-provider';

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun' | (string & {});

/**
 * Package Manager DetectResult
 */
export interface DetectResult {
  packageManager: PackageManager;
  reason: 'lockfile' | 'binary' | 'default' | 'user';
  folder: Uri;
}
export const LOCKFILES: Record<PackageManager, string[]> = {
  pnpm: ['pnpm-lock.yaml'],
  yarn: ['yarn.lock'],
  npm: ['package-lock.json', 'npm-shrinkwrap.json'],
  bun: ['bun.lockb'],
};
export const NodePackageManagerPriority = ['pnpm', 'yarn', 'npm', 'bun'];
export const DEFAULT_PACKAGE_MANAGER = 'npm';

export const detectNodePackageManager = async (folder: WorkspaceFolder) => {
  const folderPath = folder.uri.fsPath;

  for (const pm of NodePackageManagerPriority) {
    const files = LOCKFILES[pm];
    for (const f of files) {
      const p = path.join(folderPath, f);
      try {
        await exists(p);
        return { packageManager: pm, reason: 'lockfile', folder: folder.uri };
      } catch {
        // not found
      }
    }
  }
  return { packageManager: DEFAULT_PACKAGE_MANAGER, reason: 'default', folder: folder.uri };
};

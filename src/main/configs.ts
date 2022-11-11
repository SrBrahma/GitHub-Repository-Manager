import os from 'os';
import { workspace } from 'vscode';

// Outside of class to call without `this.`.
function getConfig<T>(section: string, defaultVal: T): T {
  // Is this default needed? Or settings.json will always use its default value?
  // because get() has `undefined` on its type.
  return (
    workspace.getConfiguration('githubRepositoryManager').get<T>(section) ??
    defaultVal
  );
}

export class Configs {
  static get alwaysCloneToDefaultDirectory(): boolean {
    return getConfig<boolean>('alwaysCloneToDefaultDirectory', false);
  }

  static get defaultCloneDirectoryMaximumDepth(): number {
    return getConfig<number>('defaultCloneDirectoryMaximumDepth', 2);
  }

  static get directoriesToIgnore(): string[] {
    return getConfig<string[]>('directoriesToIgnore', [
      '.vscode',
      '.git',
      'node_modules',
    ]);
  }

  static get gitDefaultCloneDir(): string | undefined {
    let path = workspace.getConfiguration('git').get<string>('defaultCloneDirectory');
    if (path) path = path.replace(/^~/, os.homedir());
    return path;
  }

  static get defaultCloneToDir(): string {
    return this.gitDefaultCloneDir || os.homedir();
  }
}

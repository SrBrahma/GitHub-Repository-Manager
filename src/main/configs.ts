import { workspace } from 'vscode';
import os from 'os';


// Outside of class to call without `this.`.
function getConfig<T>(section: string) {
  return workspace.getConfiguration('githubRepositoryManager').get<T>(section);
}


class Configs {
  get alwaysCloneToDefaultDirectory() { return getConfig<boolean>('alwaysCloneToDefaultDirectory'); }
  get coloredIcons() { return getConfig<boolean>('coloredIcons');}
  get defaultCloneDir(): string | undefined {
    let path = workspace.getConfiguration('git').get<string>('defaultCloneDirectory');
    if (path)
      path = path.replace(/^~/, os.homedir());
    return path;
  }

  get defaultCloneToDir(): string { return this.defaultCloneDir || os.homedir(); }

  clonedReposSearch = clonedReposSearch;
}





function _clonedReposSearch<T>(section: string) { return getConfig<T>('clonedRepositoriesSearch.' + section); }
const clonedReposSearch = {
  get defaultCloneDirMaxDepth() { return _clonedReposSearch<number>('defaultCloneDirectoryMaximumDepth') ?? 3;},
  get dirsToSkip() { return _clonedReposSearch<string[]>('directoriesToSkip'); },
};




export const configs = new Configs();
import { workspace } from 'vscode';
import os from 'os';



class Configs {
  getConfig = getConfig;
  get alwaysCloneToDefaultDirectory() { return getConfig<boolean>('alwaysCloneToDefaultDirectory'); }

  get defaultCloneDir(): string | undefined {
    let path = workspace.getConfiguration('git').get<string>('defaultCloneDirectory');
    if (path)
      path = path.replace(/^~/, os.homedir());
    return path;
  }

  get defaultCloneToDir(): string {
    return this.defaultCloneDir || os.homedir();
  }

  clonedReposSearch = clonedReposSearch;
}



function getConfig<T>(section: string) {
  return workspace.getConfiguration('githubRepositoryManager').get<T>(section);
}

// Outside of Configs class to don't have to use this. etc. Less visual space.

function _clonedReposSearch<T>(section: string) { return getConfig<T>('clonedRepositoriesSearch.' + section); }
const clonedReposSearch = {
  get searchOnDefaultCloneDir() { return _clonedReposSearch<boolean>('searchOnDefaultCloneDirectory'); },
  get defaultCloneDirMaxDepth() { return _clonedReposSearch<number>('defaultCloneDirectoryMaximumDepth'); },
  get dirsToSkip() { return _clonedReposSearch<string[]>('directoriesToSkip'); }
};




export const configs = new Configs();
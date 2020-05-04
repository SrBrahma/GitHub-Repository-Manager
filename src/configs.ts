import { workspace } from "vscode";
import os from 'os';

class Configs {
  getConfig<type>(section: string) {
    return workspace.getConfiguration('githubRepoMgr').get<type>(section);
  }

  get defaultCloneDir() {
    let path = workspace.getConfiguration('git').get<string>('defaultCloneDirectory');
    path = path.replace(/^~/, os.homedir());
    return path;
  }

  get saveToken() { return this.getConfig<boolean>('saveToken'); }
}

export const configs = new Configs();
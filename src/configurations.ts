import { workspace } from "vscode";


class Configs {
  getConfig(section: string) {
    return workspace.getConfiguration('githubRepoMgr').get(section);
  }
  get saveToken() { return this.getConfig('saveToken'); }
}

export const configs = new Configs();
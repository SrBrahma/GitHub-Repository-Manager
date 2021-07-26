import vscode from 'vscode';
import { pathHasGit } from '../commands/utils/pathHasGit/pathHasGit';


type State = 'noGit' | 'gitNoRemote' | 'gitWithRemote';
type Special = {
  workspaceFolder: vscode.WorkspaceFolder;
  state: State;
  disposable: () => void;
};


async function checkState(path: string): Promise<State> {
  const containsGit = await pathHasGit(path);
  if (!containsGit)
    return 'noGit';
  return 'gitWithRemote'; // TODO;
}


class WorkspaceClass {
  private workspaceFolderSpecial: Special[] = [];

  activate() {
    const fun = () => {
      this.resetGitWatcher().catch((err: any) => console.error(err.message));
    };

    fun(); // Run on start
    vscode.workspace.onDidChangeWorkspaceFolders(() => { fun(); }); // Run on changes
  }

  deactivate() {
    this.workspaceFolderSpecial.forEach(w => w.disposable());
    this.workspaceFolderSpecial = [];
  }

  private updated() {
    const containsNoGit = this.workspaceFolderSpecial.find(w => w.state === 'noGit');
    const containsGitNoRemote = this.workspaceFolderSpecial.find(w => w.state === 'gitNoRemote');
    void vscode.commands.executeCommand('setContext', 'containsNoGit', containsNoGit);
    void vscode.commands.executeCommand('setContext', 'containsGitNoRemote', containsGitNoRemote);
  }

  private async resetGitWatcher() {
    this.workspaceFolderSpecial.forEach(w => w.disposable()); // dispose all: ;
    this.workspaceFolderSpecial = []; // Reset
    const workspaceFolders = vscode.workspace.workspaceFolders ?? [];
    this.workspaceFolderSpecial = await Promise.all(workspaceFolders?.map(async workspaceFolder => {
      const watcher = vscode.workspace.createFileSystemWatcher(`${workspaceFolder.uri.path}/.git/**`);
      const newSpecial: Special = {
        workspaceFolder,
        disposable: watcher.dispose,
        state: await checkState(workspaceFolder.uri.fsPath),
      };
      const fun = async () => {
        newSpecial.state = await checkState(workspaceFolder.uri.fsPath);
        this.updated();
      };
      watcher.onDidChange(() => fun());
      watcher.onDidCreate(() => fun());
      watcher.onDidDelete(() => fun());
      return newSpecial;
    }));
    this.updated();
  }

}



export const Workspace = new WorkspaceClass();
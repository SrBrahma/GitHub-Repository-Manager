import vscode from 'vscode';
import { gitHasRemote } from '../commands/git/gitHasRemote/gitHasRemote';


export type WorkspaceFolderState = 'noGit' | 'gitWithoutRemote' | 'gitWithRemote';
type WorkspaceFolderSpecial = {
  workspaceFolder: vscode.WorkspaceFolder;
  state: WorkspaceFolderState;
  disposable: () => void;
};


async function checkState(path: string): Promise<WorkspaceFolderState> {
  try {
    const hasRemote = await gitHasRemote(path);
    return hasRemote ? 'gitWithRemote' : 'gitWithoutRemote';
  } catch (err) { // gitHasRemote throws error if path has no git.
    return 'noGit';
  }
}


class WorkspaceClass {
  workspaceFolderSpecial: WorkspaceFolderSpecial[] = [];

  activate() {
    const fun = () => {
      this.resetGitWatcher().catch((err: any) => console.error(err.message));
    };

    fun(); // Run on start
    vscode.workspace.onDidChangeWorkspaceFolders(() => fun()); // Run on changes
  }

  deactivate() {
    this.workspaceFolderSpecial.forEach(w => w.disposable());
    this.workspaceFolderSpecial = [];
  }

  private updated() {
    const containsNoGit = this.workspaceFolderSpecial.find(w => w.state === 'noGit');
    const containsGitWithoutRemote = this.workspaceFolderSpecial.find(w => w.state === 'gitWithoutRemote');
    void vscode.commands.executeCommand('setContext', 'containsNoGit', containsNoGit);
    void vscode.commands.executeCommand('setContext', 'containsGitWithoutRemote', containsGitWithoutRemote);
  }

  private async resetGitWatcher() {
    this.workspaceFolderSpecial.forEach(w => w.disposable()); // dispose all: ;
    this.workspaceFolderSpecial = []; // Reset
    const workspaceFolders = vscode.workspace.workspaceFolders ?? [];
    this.workspaceFolderSpecial = await Promise.all(workspaceFolders?.map(async workspaceFolder => {
      const watcher = vscode.workspace.createFileSystemWatcher(`${workspaceFolder.uri.path}/.git/config`);
      const newSpecial: WorkspaceFolderSpecial = {
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
    })); // End of Promise.all;
    this.updated(); // update after setting the new array.
  } // End of resetGitWatcher;

} // End of WorkspaceClass;



export const Workspace = new WorkspaceClass();
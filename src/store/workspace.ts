import vscode from 'vscode';
import { gitHasRemote } from '../commands/git/gitHasRemote/gitHasRemote';
import { myExtensionSetContext } from '../main/utils';



export type WorkspaceFolderState = 'noGit' | 'gitWithoutRemote' | 'gitWithRemote';
export type PublishableFolderState = Exclude<WorkspaceFolderState, 'gitWithRemote'>;
type WorkspaceFolderSpecial = {
  workspaceFolder: vscode.WorkspaceFolder;
  state: WorkspaceFolderState;
  disposable: () => void;
};


async function checkState(path: string): Promise<WorkspaceFolderState> {
  try {
    const hasRemote = await gitHasRemote(path);
    return hasRemote ? 'gitWithRemote' : 'gitWithoutRemote';
  } catch (err: any) { // gitHasRemote throws error if path has no git.
    return 'noGit';
  }
}


class WorkspaceClass {

  /** To be used inside this class */
  private workspaceFolderSpecial: WorkspaceFolderSpecial[] = [];

  /** To be used by Publish UI command */
  public get foldersAndStates(): {state: WorkspaceFolderState; path: string; name: string}[] {
    return this.workspaceFolderSpecial.map((w) => ({
      path: w.workspaceFolder.uri.fsPath,
      state: w.state,
      name: w.workspaceFolder.name,
    }));
  }

  public get publishableFoldersAndStates(): {state: PublishableFolderState; path: string; name: string}[] {
    return this.foldersAndStates.filter((w) => w.state === 'gitWithoutRemote' || w.state === 'noGit') as any; // We are sure.
  }

  activate() {
    const fun = () => {
      this.resetGitWatcher().catch((err: any) => console.error(err.message));
    };

    fun(); // Run on start
    vscode.workspace.onDidChangeWorkspaceFolders(() => fun()); // Run on changes
  }

  deactivate() {
    this.workspaceFolderSpecial.forEach((w) => w.disposable());
    this.workspaceFolderSpecial = [];
  }

  private updated() {
    const containsNoGit = this.workspaceFolderSpecial.find((w) => w.state === 'noGit');
    const containsGitWithoutRemote = this.workspaceFolderSpecial.find((w) => w.state === 'gitWithoutRemote');
    void myExtensionSetContext('canPublish', containsNoGit || containsGitWithoutRemote);
  }

  private async resetGitWatcher() {
    this.workspaceFolderSpecial.forEach((w) => w.disposable()); // dispose all: ;
    this.workspaceFolderSpecial = []; // Reset
    const workspaceFolders = vscode.workspace.workspaceFolders ?? [];
    this.workspaceFolderSpecial = await Promise.all(workspaceFolders.map(async (workspaceFolder) => {
      const watcherDir = vscode.workspace.createFileSystemWatcher(`${workspaceFolder.uri.path}/.git`); // just watching config wouldn't catch ./git deletion.
      const watcherFile = vscode.workspace.createFileSystemWatcher(`${workspaceFolder.uri.path}/.git/config`);
      const newSpecial: WorkspaceFolderSpecial = {
        workspaceFolder,
        disposable: () => { watcherDir.dispose(); watcherFile.dispose(); },
        state: await checkState(workspaceFolder.uri.fsPath),
      };
      const fun = async () => {
        newSpecial.state = await checkState(workspaceFolder.uri.fsPath);
        this.updated();
      };

      watcherDir.onDidChange(() => fun());
      watcherDir.onDidCreate(() => fun());
      watcherDir.onDidDelete(() => fun());
      watcherFile.onDidChange(() => fun());
      watcherFile.onDidCreate(() => fun());
      watcherFile.onDidDelete(() => fun());

      return newSpecial;
    })); // End of Promise.all;
    this.updated(); // update after setting the new array.
  } // End of resetGitWatcher;

} // End of WorkspaceClass;



export const Workspace = new WorkspaceClass();
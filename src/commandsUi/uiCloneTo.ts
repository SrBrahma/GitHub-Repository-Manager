import { workspace, window, Uri, commands } from 'vscode';
import { cloneRepo } from '../commands/cloneRepository/cloneRepository';
import path from 'path';
import { Configs } from '../main/configs';
import { Repository } from '../store/repository';
import { User } from '../store/user';

// Made to look similar to vscode clone command. Also, took some small pieces from it.
// uses the git.defaultCloneDirectory setting, as, you know, the default clone directory.



// VsCode clone openLabel : 'Select repository location'
// Our Label with same len: 'Clone /12345678901... Here', as I don't know the max label length.
// From here we took the magic numbers 15 and 12 used on labelRepoName.
// Uses the repoName in the openLabel, as the user could missclick the desired repo,
// and clone a wrong one.
// This '/' is to give to the user a  hint that it will create a directory.

const openStr = 'Open';
const openInNewWindowStr = 'Open in New Window';
const addToWorkspaceStr = 'Add to Workspace';

// TODO: Add cancel button
export async function uiCloneTo(repo: Repository): Promise<void> {
  // Took this dir path code from vscode git clone code.

  if (!User.token)
    throw new Error('User token is not set!');

  let labelRepoName = `/${repo.name}`;
  if (labelRepoName.length >= 15)
    labelRepoName = `${labelRepoName.substr(0, 12)}...`;

  let parentPath: string = '';

  if (!Configs.alwaysCloneToDefaultDirectory) {
    const thenable = await window.showOpenDialog({
      defaultUri: Uri.file(Configs.defaultCloneToDir),
      openLabel: `Clone ${labelRepoName} here`,
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
    });

    if (!thenable) // Cancel if quitted dialog
      return;

    parentPath = thenable[0].fsPath;
  } else {
    parentPath = Configs.defaultCloneToDir;
  }

  const repoPath = path.resolve(parentPath, repo.name);
  const uri = Uri.file(repoPath);

  // Will leave it as status bar until we have a cancel button.
  const statusBar = window.setStatusBarMessage(`Cloning ${repo.name} to ${repoPath}...`);
  try {
    await cloneRepo({ repository: repo, parentPath, token: User.token });
    statusBar.dispose();
  } catch (err) {
    statusBar.dispose();
    void window.showErrorMessage(err.message);
    return;
  }

  await Promise.all([
    User.reloadRepos(),
    async () => {
      const action = await window.showInformationMessage(`Cloned ${repo.name} to ${repoPath}!`,
        openStr, openInNewWindowStr, addToWorkspaceStr);

      switch (action) {
        case openStr:
          void commands.executeCommand('vscode.openFolder', uri); break;
        case openInNewWindowStr:
          void commands.executeCommand('vscode.openFolder', uri, true); break;
        case addToWorkspaceStr:
          workspace.updateWorkspaceFolders(workspace.workspaceFolders?.length ?? 0, 0, { uri }); break;
      }
    },
  ]);

}
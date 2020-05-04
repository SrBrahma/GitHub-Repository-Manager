import { workspace, window, Uri, commands } from 'vscode';
import { Repository, repositories } from "../Repository/Repository";
import { cloneRepo } from "../octokit/commands/cloneRepo";
import os from 'os';
import path from 'path';

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
export async function uiCloneTo(repo: Repository) {
  // Took this dir path code from vscode git clone code.
  const config = workspace.getConfiguration('git');
  let defaultCloneDirectory = config.get<string>('defaultCloneDirectory') || os.homedir();
  defaultCloneDirectory = defaultCloneDirectory.replace(/^~/, os.homedir());

  let labelRepoName = `/${repo.name}`;
  if (labelRepoName.length >= 15)
    labelRepoName = `${labelRepoName.substr(0, 12)}...`;

  const thenable = await window.showOpenDialog({
    defaultUri: Uri.file(defaultCloneDirectory),
    openLabel: `Clone ${labelRepoName} here`,
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false
  });

  if (!thenable) // Cancel if quitted dialog
    return;

  const parentPath = thenable[0].fsPath;

  const repoPath = path.resolve(parentPath, repo.name);
  const uri = Uri.file(repoPath);

  // Will leave it as status bar until we have a cancel button.
  const statusBar = window.setStatusBarMessage(`Cloning ${repo.name} to ${repoPath}...`);
  try {
    await cloneRepo(repo, parentPath);
    statusBar.dispose();
  }
  catch (error) {
    statusBar.dispose();
    window.showErrorMessage(error.message);
    return;
  }

  repositories.loadRepos();

  const action = await window.showInformationMessage(`Cloned ${repo.name} to ${repoPath}!`,
    openStr, openInNewWindowStr, addToWorkspaceStr);
  switch (action) {
    case openStr:
      commands.executeCommand('vscode.openFolder', uri); break;
    case openInNewWindowStr:
      commands.executeCommand('vscode.openFolder', uri, true); break;
    case addToWorkspaceStr:
      workspace.updateWorkspaceFolders(workspace.workspaceFolders!.length, 0, { uri }); break;
  }
};
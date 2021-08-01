// We are not calling uiCreateRepo to leave further customization.

import vscode from 'vscode';
import { initGit } from '../commands/git/initGit/initGit';
import path from 'path';
import { User } from '../store/user';
import { pathHasGit } from '../commands/git/pathHasGit/pathHasGit';
import { Workspace, WorkspaceFolderState } from '../store/workspace';
import { OnRepositoryCreation, uiCreateRepoCore } from './uiCreateRepo';
import { myQuickPick } from '../vscode/myQuickPick';


/** May throw errors. */
export async function getWorkspaceFolderPathToPublish(
  stateFilter: Exclude<WorkspaceFolderState, 'gitWithRemote'>,
): Promise<string | undefined> {
  if (!User.login)
    return;
  const filteredFolders = Workspace.workspaceFolderSpecial.filter(w => w.state === stateFilter);
  if (filteredFolders.length === 0)
    return;
  if (filteredFolders.length === 1)
    return filteredFolders[0]!.workspaceFolder.uri.fsPath;
  // If multiple folders
  else {
    const path = (await myQuickPick({
      items: filteredFolders.map(w => ({
        label: w.workspaceFolder.name, description: w.workspaceFolder.uri.fsPath,
      })),
      title: 'Select the workspace folder to publish to GitHub',
      ignoreFocusOut: false,
    }))?.description;

    return path;
  }
}



export async function uiCreateRepoNoGit(): Promise<void> {
  /** The project path. */
  const cwd = await getWorkspaceFolderPathToPublish('noGit');

  if (!cwd)
    return;

  if (await pathHasGit(cwd))
    throw new Error('Project already has .git!');

  if (!User.token)
    throw new Error('User token isn\'t set!');


  const onRepositoryCreation: OnRepositoryCreation = async (newRepository) => {

    await initGit(cwd, {
      remote: {
        owner: newRepository.owner!.login,
        repositoryName: newRepository.name,
      },
      commitAllAndPush: {
        token: User.token!, // Already checked above.
      },
      cleanOnError: true,
    });

    await Promise.all([
      User.reloadRepos(),
      (async () => {
        const actions = ['Open GitHub Page'];
        const action = await vscode.window.showInformationMessage(
          `Repository '${newRepository.name}' created and Git initialized for the current files!`,
          ...actions,
        );
        if (action === actions[0]) {
          const repositoryUrl = newRepository.html_url; // this prop is the right one, = 'https://github.com/author/repo'
          await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(repositoryUrl));
        }
      })(),
    ]); // End of Promise.all
  };

  await uiCreateRepoCore({
    repositoryNamePrompt: `Enter the new repository name for the chosen workspace folder`,
    repositoryNameInitialValue: path.basename(cwd),
    onRepositoryCreation,
  });

}
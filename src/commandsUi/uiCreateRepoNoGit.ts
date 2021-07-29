// We are not calling uiCreateRepo to leave further customization.

import vscode from 'vscode';
import { createGitHubRepository } from '../commands/github/createGitHubRepository';
import { initGit } from '../commands/git/initGit/initGit';
import path from 'path';
import { User } from '../store/user';
import { pathHasGit } from '../commands/git/pathHasGit/pathHasGit';
import { Workspace, WorkspaceFolderState } from '../store/workspace';


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
    const items: vscode.QuickPickItem[] = filteredFolders.map(w => ({
      label: w.workspaceFolder.name, description: w.workspaceFolder.uri.fsPath,
    }) );
    const quickPick = vscode.window.createQuickPick();
    quickPick.title = 'Select the workspace folder to publish to GitHub';
    quickPick.items = items;
    quickPick.show();
    const selection = await new Promise<vscode.QuickPickItem | undefined>(resolve => {
      quickPick.onDidChangeSelection(e => { resolve(e[0]); });
      quickPick.onDidHide(() => resolve(undefined));
    });

    quickPick.dispose();
    // The path is in the description
    return selection?.description;
  }
}


// Those are here so if we have an error, so the user doesn't have to fill again.
let previousUnsuccessfulPath = '';
let previousUnsuccessfulDescription = '';


export async function uiCreateRepoNoGit(): Promise<void> {

  const projectPath = await getWorkspaceFolderPathToPublish('noGit');

  if (!projectPath)
    return;

  // Reset description if there was a previous description filled but for another project path
  if (projectPath !== previousUnsuccessfulPath)
    previousUnsuccessfulDescription = '';

  if (await pathHasGit(projectPath))
    throw new Error('Project already has .git!');

  if (!User.token)
    throw new Error('User token isn\'t set!');

  const name: string = (await vscode.window.showInputBox({
    prompt: `Enter the new repository name for the current workspace folder`,
    placeHolder: 'Repository name',
    value: path.basename(projectPath),
    ignoreFocusOut: true,
  }))?.trim() ?? '';

  previousUnsuccessfulPath = projectPath;

  if (!name) { // Don't allow empty names. This also catches `undefined`, if user pressed Esc.
    previousUnsuccessfulDescription = ''; // reset description, only keep name.
    return;
  }

  // User won't be able to quit dialogue now by pressing Esc, as empty descriptions are allowed.
  const description = (await vscode.window.showInputBox({
    prompt: 'Enter the repository description',
    placeHolder: 'Repository description (optional)',
    value: previousUnsuccessfulDescription || '\r\n', // By luck (I thought it would work, and it did! :)) I found out that using this as default value,
    // we can differentiate a Esc (returns undefined) to a empty input Enter (would originally also returns undefined,
    // now return \r\n). It also keeps showing the place holder. Also, it doesn't seem to be possible to the user erase it.
    ignoreFocusOut: true,
  }))?.trim(); // Removes the '\r\n' and other whitespaces.

  if (description === undefined)
    return;

  previousUnsuccessfulDescription = description;


  // Private is first so if the user creates the repo by mistake (Enter-enter-enter),
  // he won't 'feel too much bad' for publishing trash to his GitHub, like I did lol.
  const visibility = await vscode.window.showQuickPick(['Private', 'Public']); // TODO add label?

  if (visibility === undefined) // If user pressed Esc
    return;

  const isPrivate = visibility === 'Private';

  try {
    const newRepository = await createGitHubRepository({ name, description, isPrivate });

    const repositoryUrl = newRepository.html_url; // this prop is the right one, = 'https://github.com/author/repo'

    await initGit(projectPath, {
      remoteUrl: {
        owner: newRepository.owner!.login,
        repositoryName: newRepository.name,
      },
      commitAllAndPush: {
        token: User.token,
      },
      cleanOnError: true,
    });

    previousUnsuccessfulPath = ''; // Clears the fields, as we successfully created the repo.
    previousUnsuccessfulDescription = '';

    await Promise.all([
      User.reloadRepos(),
      (async () => {
        const actions = ['Open GitHub Page'];
        const action = await vscode.window.showInformationMessage(
          `Repository ${name} created and git initialized successfully for the current files!`,
          ...actions,
        );
        if (action === actions[0])
          await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(repositoryUrl));
      })(),

    ]);

  } catch (err) {
    void vscode.window.showErrorMessage(err.message);
    return;
  }
}
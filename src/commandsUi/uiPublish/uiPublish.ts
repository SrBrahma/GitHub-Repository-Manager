import path from 'path';
import vscode from 'vscode';
import { User } from '../../store/user';
import { Workspace } from '../../store/workspace';
import { myQuickPick } from '../../vscode/myQuickPick';
import { OnRepositoryCreation, uiCreateRepoCore } from '../uiCreateRepo';
import { posNoGit, preNoGit } from './noGit';
import { posNoRemote, preNoRemote, preRepositoryCreateNoRemote as preRepositoryCreationNoRemote } from './noRemote';



async function getWorkspaceFolderPathToPublish() {
  if (!User.login)
    return undefined;

  const publishableFolders = Workspace.publishableFoldersAndStates;

  if (publishableFolders.length === 0)
    return undefined;

  if (publishableFolders.length === 1) {
    const folder = publishableFolders[0]!;
    return { path: folder.path, state: folder.state };
  } else { // If multiple folders

    const quickPick = await myQuickPick({
      items: publishableFolders.map((w) => ({
        label: w.name,
        description: w.path,
        // detail: w.state === 'noGit' ? "Will also initialize Git" : "Doesn't have a remote, will be added",
        // ^ hmm... not using it. too much info for the user.
      })),
      title: 'Select the workspace folder to publish to GitHub',
      ignoreFocusOut: false,
    });

    if (!quickPick) // If user cancelled
      return undefined;

    const path = quickPick.description!;
    return {
      path,
      state: (publishableFolders.find((f) => path === f.path))!.state,
    };

  }
}





export async function uiPublish(): Promise<void> {
  try {
    if (!User.token)
      throw new Error('User token isn\'t set!');

    /** Get project path and state. */
    const folder = await getWorkspaceFolderPathToPublish();

    if (!folder)
      return;

    const { path: cwd, state } = folder;

    let headBranch: string | undefined;

    if (state === 'noGit')
      await preNoGit({ cwd });
    else
      await preNoRemote({ cwd });


    const onRepositoryCreation: OnRepositoryCreation = async (newRepository) => {
      if (state === 'noGit')
        await posNoGit({ cwd, newRepository });
      else {
        if (!headBranch)
          throw new Error('headBranch not set! Contact extension developer.'); // Shouldn't happen.
        await posNoRemote({ cwd, newRepository, headBranch });
      }

      await Promise.all([
        User.reloadRepos(),
        (async () => {
          const actions = ['Open GitHub Page'];
          const action = await vscode.window.showInformationMessage(
            `Repository '${newRepository.name}' created for the current project!`,
            ...actions,
          );
          if (action === actions[0]) {
            const repositoryUrl = newRepository.html_url; // this prop is the right one, = 'https://github.com/author/repo'
            await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(repositoryUrl));
          }
        })(),
      ]); // End of Promise.all
    };

    /** May error without throwing. Don't execute anything after it. */
    await uiCreateRepoCore({
      repositoryNamePrompt: `Enter the new repository name for the chosen workspace folder`,
      repositoryNameInitialValue: path.basename(cwd),
      onRepositoryCreation,
      preRepositoryCreation: async () => {
        if (state === 'gitWithoutRemote') {
          const result = await preRepositoryCreationNoRemote({ cwd });
          if (!result)
            return 'cancel';
          headBranch = result.headBranch;
        }
      },
    });

  } catch (err: any) {
    void vscode.window.showErrorMessage(err.message);
  }
}
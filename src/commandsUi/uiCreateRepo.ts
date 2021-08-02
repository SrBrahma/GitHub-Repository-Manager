import vscode from 'vscode';
import { createGitHubRepository, CreateGitHubRepositoryReturn } from '../commands/github/createGitHubRepository';
import { User } from '../store/user';
import { myQuickPick } from '../vscode/myQuickPick';
import { uiCloneTo } from './uiCloneTo';

export type NewRepository = CreateGitHubRepositoryReturn;
export type OnRepositoryCreation = (newRepository: NewRepository) => Promise<void>;

/** To be used by the 3 repo creations UI functions.
 *
 * Doesn't throw errors. */
export async function uiCreateRepoCore(options: {
  repositoryNamePrompt: string;
  repositoryNameInitialValue: string;
  onRepositoryCreation: OnRepositoryCreation;
}): Promise<void> {

  try {
    const name: string = (await vscode.window.showInputBox({
      prompt: options.repositoryNamePrompt,
      placeHolder: 'Repository name',
      value: options.repositoryNameInitialValue,
      ignoreFocusOut: true,
    }))?.trim() ?? '';

    if (!name) // Don't allow empty names. This also catches `undefined`, if user pressed Esc.
      return;

    // User won't be able to quit dialogue now by pressing Esc, as empty descriptions are allowed.
    const description = (await vscode.window.showInputBox({
      prompt: 'Enter the repository description',
      placeHolder: 'Repository description (optional)',
      value: '\r\n', // By luck (I thought it would work, and it did! :)) I found out that using this as default value,
      // we can differentiate a Esc (returns undefined) to a empty input Enter (would originally also returns undefined,
      // now return \r\n). It also keeps showing the place holder. Also, it doesn't seem to be possible to the user erase it.
      ignoreFocusOut: true,
    }))?.trim(); // Removes the '\r\n' and other whitespaces.

    if (description === undefined)
      return;

    const visibility = (await myQuickPick({
      // Private is first so if the user creates the repo by mistake (Enter-enter-enter),
      // he won't 'feel too much bad' for publishing trash to his GitHub, like I did lol.
      items: [{ label: 'Private' }, { label: 'Public' }],
      title: 'Select the repository visibility',
      ignoreFocusOut: true,
    }))?.label;

    if (visibility === undefined) // If user pressed Esc
      return;

    const isPrivate = visibility === 'Private';

    const newRepository = await createGitHubRepository({ name, description, isPrivate });

    await options.onRepositoryCreation(newRepository);

  } catch (err) {
    const errMessage = err.message as string;
    let message = errMessage;
    // The error message from octokit is a little strange. Is a JSON but has a string before it.
    // We manually transform the common error messages here.
    if (errMessage.includes('name already exists on this account'))
      message = 'Repository name already exists on this account!';
    void vscode.window.showErrorMessage(message);
    return;
  }
}

/** Doesn't throw errors. */
export async function uiCreateRepo(): Promise<void> {
  await uiCreateRepoCore({
    repositoryNameInitialValue: '',
    repositoryNamePrompt: 'Enter the new repository name',
    onRepositoryCreation: async newRepository => {
      await Promise.all([
        User.reloadRepos(),
        (async () => {
          const actions = ['Clone it'];
          const answer = await vscode.window.showInformationMessage(`Repository '${newRepository.name}' created successfully!`, ...actions);

          if (answer === actions[0]) {
            if (!newRepository.owner?.login) // certainly wont happen
              throw new Error(`newRepository.owner?.login doesn't exist!`);
            await uiCloneTo({
              ownerLogin: newRepository.owner?.login,
              name: newRepository.name,
              reloadRepos: true,
            });
          }
        })(),
      ]);
    },
  });
}
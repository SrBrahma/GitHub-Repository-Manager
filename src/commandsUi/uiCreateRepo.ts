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
  /** Run after the repository info questions but before the creation itself.
   *
   * Return 'cancel' to cancel and exit the flow. */
  preRepositoryCreation?: () => Promise<('cancel' | undefined)>;
}): Promise<void> {

  try {
    /** If undefined, should create repository to the user */
    let organizationLogin: string | undefined = undefined;

    const orgsUserCanCreateRepo = User.organizationUserCanCreateRepositories;

    if (orgsUserCanCreateRepo.length === 0)
      return; // Just don't do nothing. The user just hasn't loaded yet!
      // throw new Error('There is nowhere to the user to publish!');

    else if (orgsUserCanCreateRepo.length === 1) {
      // Do nothing if user is the only available org.
    } else { // Else, pick one!
      const userDescription = 'Your personal account';
      const pick = (await myQuickPick({
        items: orgsUserCanCreateRepo.map((e) => ({
          label: (e.login === User.login) ? e.login : e.name,
          description: (e.login === User.login) ? userDescription : e.login,
        })),
        ignoreFocusOut: false,
        title: 'Should the new repository be created in your account or in an Organization?',
      }));

      if (!pick)
        return;

      const havePickedUser = pick.description === userDescription;

      if (!havePickedUser)
        organizationLogin = pick.description!;
    }

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

    const preRepoCreationResult = await options.preRepositoryCreation?.();
    if (preRepoCreationResult === 'cancel') // Quit if true
      return;

    const newRepository = await createGitHubRepository({ name, description, isPrivate, organizationLogin });

    await options.onRepositoryCreation(newRepository);

  } catch (err: any) {
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
    onRepositoryCreation: async (newRepository) => {
      await Promise.all([
        User.reloadRepos(),
        (async () => {
          const actions = ['Clone it'];
          const answer = await vscode.window.showInformationMessage(`Repository '${newRepository.name}' created successfully!`, ...actions);

          if (answer === actions[0]) {
            if (!newRepository.owner.login) // certainly wont happen
              throw new Error(`newRepository.owner?.login doesn't exist!`);
            await uiCloneTo({
              ownerLogin: newRepository.owner.login,
              name: newRepository.name,
              reloadRepos: true,
            });
          }
        })(),
      ]);
    },
  });
}
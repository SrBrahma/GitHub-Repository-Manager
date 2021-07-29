import { window } from 'vscode';
import { createGitHubRepository } from '../commands/github/createGitHubRepository';
import { User } from '../store/user';
import { uiCloneTo } from './uiCloneTo';


// Those are here so if we have an error, so the user doesn't have to fill again.
let previousUnsuccessfulName = '';
let previousUnsuccessfulDescription = '';


/** Doesn't throw errors. */
export async function uiCreateRepo(): Promise<void> {

  const name: string = (await window.showInputBox({
    prompt: 'Enter the new repository name',
    placeHolder: 'Repository name',
    value: previousUnsuccessfulName,
    ignoreFocusOut: true,
  }))?.trim() ?? '';

  previousUnsuccessfulName = name;

  if (!name) { // Don't allow empty names. This also catches `undefined`, if user pressed Esc.
    previousUnsuccessfulDescription = ''; // reset description, only keep name.
    return;
  }

  // User won't be able to quit dialogue now by pressing Esc, as empty descriptions are allowed.
  const description = (await window.showInputBox({
    prompt: 'Enter the repository description (optional)',
    placeHolder: 'Repository description',
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
  const visibility = await window.showQuickPick(['Private', 'Public']);

  if (visibility === undefined) // If user pressed Esc
    return;

  const isPrivate = visibility === 'Private';

  try {
    const newRepository = await createGitHubRepository({ name, description, isPrivate });

    previousUnsuccessfulName = ''; // Clears the fields, as we successfully created the repo.
    previousUnsuccessfulDescription = '';

    const answer = await window.showInformationMessage(`Repository ${name} created successfully! Do you want to clone it?`, 'Yes', 'No');

    if (answer === 'Yes') {
      if (!newRepository.owner?.login)
        throw new Error(`newRepository.owner?.login doesn't exist!`);
      await uiCloneTo({
        ownerLogin: newRepository.owner?.login,
        name: newRepository.name,
        reloadRepos: true,
      });
    } else {
      await User.reloadRepos();
    }

  } catch (err) {
    void window.showErrorMessage(err.message);
    return;
  }
}
import { window } from 'vscode';
import { create } from '../octokit/createRepo';
import { User } from '../store/user';
import { uiCloneTo } from './uiCloneTo';

// Those are here so if we have an error, so the user doesn't have to fill again.
let name = '';
let description = '';
let privateRepo = false;

export async function uiCreateRepo(): Promise<void> {

  // let rtn: Thenable<string>;
  const tempName = await window.showInputBox({
    prompt: 'Enter the new repository name',
    placeHolder: 'Repository name',
    value: name,
    ignoreFocusOut: true,
  });
  if (tempName)
    name = tempName.trim();

  if (!tempName) // We don't allow empty names.
    return;

  // User won't be able to quit dialogue now by pressing Esc, as empty descriptions are allowed.
  const descriptionTemp = await window.showInputBox({
    prompt: 'Enter the repository description (optional)',
    placeHolder: 'Repository description',
    value: description || '\r\n', // By luck (I thought it would work, and it did) I found out that using this as default value,
    // we can differentiate a Esc (returns undefined) to a empty input Enter (would originally also returns undefined,
    // now return \r\n). It also keeps showing the place holder. Also, it doesn't seem to be possible to the user erase it.
    ignoreFocusOut: true,
  });
  if (descriptionTemp === undefined)
    return;
  description = descriptionTemp.trim(); // Removes the '\r\n' and other whitespace.


  // Private is first so if the user creates the repo by mistake (Enter-enter-enter),
  // he won't 'feel too much bad' for publishing trash to his GitHub, like I did lol.
  const visibility = await window.showQuickPick(['Private', 'Public']);

  if (visibility === undefined) // If user pressed Esc
    return;

  privateRepo = visibility === 'Private';

  try {
    const newRepo = await create({ name, description, privateRepo });
    name = ''; // Clears the fields, as we successfully created the repo.
    description = '';

    // repositories.loadRepos();
    const answer = await window.showInformationMessage(`Repository ${name} created successfully! Do you want to clone it?`, 'Yes', 'No');

    if (answer === 'Yes') {
      await uiCloneTo(newRepo); // It already reloadRepos();
    } else {
      await User.reloadRepos();
    }
  } catch (err) {
    void window.showErrorMessage(err.message);
    return;
  }
}
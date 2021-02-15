import vscode from 'vscode';
import { initOctokit } from '../../octokit/octokit';
import { Auth } from '../../octokit/auth';

export function activateNotLogged() {
  // Enter token on input box
  vscode.commands.registerCommand('githubRepoMgr.commands.auth.vscodeAuth', async () => {
    try {
      const token = await Auth.authenticate();
      initOctokit(token);
    } catch (err) {
      vscode.window.showErrorMessage(err.message);
    }
  });
}

export function getNotLoggedTreeData(): vscode.TreeItem[] {
  return []; // Nothing. Will use viewsWelcome, defined in package.json.
}
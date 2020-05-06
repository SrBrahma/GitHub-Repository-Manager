import vscode, { ThemeIcon } from 'vscode';
import { TreeItem } from "../base";
import { initOctokit } from "../../octokit/octokit";
import { openOAuthWebPage, copyOAuthLinkToClipboard } from '../../octokit/oauth';

export function activateNotLogged() {
  // Open OAuth web page
  vscode.commands.registerCommand('githubRepoMgr.commands.auth.openOAuthWebPage', () => {
    openOAuthWebPage();
  });

  // Copy OAuth link to clipboard
  vscode.commands.registerCommand('githubRepoMgr.commands.auth.copyOAuthLinkToClipboard', () => {
    copyOAuthLinkToClipboard();
    vscode.window.showInformationMessage('Link copied to clipboard! Access it on a browser!');
  });

  // Enter token on input box
  vscode.commands.registerCommand('githubRepoMgr.commands.auth.enterToken', async () => {
    const token = await vscode.window.showInputBox();
    if (token) // If typed anything
      initOctokit(token);
  });
}

export function getNotLoggedTreeData() {
  return [
    new TreeItem({
      label: 'Login with',
      iconPath: new ThemeIcon('shield'),
      children: [
        // That space before the label improves readability (that the icon reduces, but they look cool!)
        new TreeItem({
          label: ' OAuth -> Open in browser',
          command: 'githubRepoMgr.commands.auth.openOAuthWebPage',
          iconPath: new ThemeIcon('globe')
        }),
        new TreeItem({
          label: ' OAuth -> Copy link to clipboard',
          command: 'githubRepoMgr.commands.auth.copyOAuthLinkToClipboard',
          iconPath: new ThemeIcon('link')

        }),
        new TreeItem({
          label: ' Personal access token',
          command: 'githubRepoMgr.commands.auth.enterToken',
          iconPath: new ThemeIcon('key')
        }),
      ]
    }),

  ];
}
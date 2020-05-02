import vscode from 'vscode';
import { TreeItem } from "./base";
import { user } from "../Octokit/User";
import { logoutAndForgetToken } from "../Octokit/octokit";

export function activateLogged() {
  // Open user profile page
  vscode.commands.registerCommand('githubRepoMgr.commands.user.openProfilePage', () =>
    vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(user.profileUri)));

  // Logout
  vscode.commands.registerCommand('githubRepoMgr.commands.auth.logout', () =>
    logoutAndForgetToken());
}

export function getLoggedTreeData() {
  return [
    new TreeItem({
      label: `Hi, ${user.login}!`,
    }),
    new TreeItem({
      label: '  Open your GitHub page',
      command: 'githubRepoMgr.commands.user.openProfilePage'
    }),
    new TreeItem({
      label: '  Logout and forget token',
      command: 'githubRepoMgr.commands.auth.logout',
      tooltip: 'Logouts and forgets the token, if stored.',
    }),
  ];
}
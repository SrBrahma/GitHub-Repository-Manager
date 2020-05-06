import vscode, { ThemeIcon } from 'vscode';
import { TreeItem } from "../base";
import { user } from "../../User/User";
import { logoutAndForgetToken } from "../../octokit/octokit";

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
      iconPath: new ThemeIcon('verified'),
      children: [
        // That space before the label improves readability (that the icon reduces, but they look cool!)
        new TreeItem({
          label: ' Open your GitHub page',
          command: 'githubRepoMgr.commands.user.openProfilePage',
          iconPath: new ThemeIcon('github')

        }),
        new TreeItem({
          label: ' Logout and forget token',
          command: 'githubRepoMgr.commands.auth.logout',
          tooltip: 'Logouts and forgets the token, if stored.',
          iconPath: new ThemeIcon('log-out')
        }),
      ]
    })
  ];
}
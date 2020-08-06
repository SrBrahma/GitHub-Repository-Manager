import { commands, Uri, env, workspace } from 'vscode';
import { RepoItem } from './repoItem';
import UserStore from '../../store';
import { cloned } from "../../store/helpers";
import { UserStatus, Repository } from '../../store/types';
import { TreeItem } from '../base';

export async function activateClonedRepos() {

  // Open
  commands.registerCommand('githubRepoMgr.commands.clonedRepos.open', ({ repo }: RepoItem) =>
    commands.executeCommand('vscode.openFolder', Uri.parse(repo.localPath)));

  // Open in New Window
  commands.registerCommand('githubRepoMgr.commands.clonedRepos.openInNewWindow', ({ repo }: RepoItem) =>
    commands.executeCommand('vscode.openFolder', Uri.parse(repo.localPath), true));

  // Add to Workspace
  commands.registerCommand('githubRepoMgr.commands.clonedRepos.addToWorkspace', ({ repo }: RepoItem) =>
    workspace.updateWorkspaceFolders(workspace.workspaceFolders!.length, 0, { uri: Uri.parse(repo.localPath) }));


  // Open Containing Folder
  commands.registerCommand('githubRepoMgr.commands.clonedRepos.openContainingFolder', ({ repo }: RepoItem) =>
    // revealFileInOS always open the parent path, that's why we pass the '/a', just a filler. Doesn't need to exist.
    commands.executeCommand('revealFileInOS', Uri.parse(repo.localPath + '/a')));

  commands.registerCommand('githubRepoMgr.commands.clonedRepos.copyPath', ({ repo }: RepoItem) => {
    env.clipboard.writeText(repo.localPath);
  });
}

function parseChildren(clonedRepos: Repository[], userLogin: string): TreeItem | TreeItem[] {
  return clonedRepos.map(repo => new RepoItem({
    repo,
    contextValue: 'githubRepoMgr.context.clonedRepo',
    command: {
      // We wrap the repo in {} because we may call the cloneTo from the right click, and it passes the RepoItem.
      command: 'githubRepoMgr.commands.clonedRepos.open',
      arguments: [{ repo }]
    },
    includeOwner: repo.ownerLogin !== userLogin
  }));
}

function sortClonedRepos(clonedRepos: Repository[], userLogin: string): Repository[] {
  return clonedRepos.sort((a, b) => {

    // User repos comes first
    if (a.ownerLogin === userLogin && b.ownerLogin !== userLogin)
      return -1;
    if (a.ownerLogin !== userLogin && b.ownerLogin === userLogin)
      return 1;

    // Different Authors are sorted (ownerLogin === userLogin doesn't enter this block)
    if (a.ownerLogin !== b.ownerLogin)
      return (a.ownerLogin.toLocaleUpperCase() < b.ownerLogin.toLocaleUpperCase())
        ? -1 : 1;

    // If same owner login, repos are sorted by name.
    return (a.name.toLocaleUpperCase() < b.name.toLocaleUpperCase())
      ? -1 : 1;
  });
}

export function getClonedTreeItem(): TreeItem | undefined {
  const user = UserStore.getState();
  if (user.status === UserStatus.logged) {
    const clonedRepos = user.organizations.map(org => cloned(org.repositories)).flat();
    const sortedClonedRepos = sortClonedRepos(clonedRepos, user.login);

    // TODO: Add remember cloned repos when not logged option?
    return new TreeItem({
      label: 'Cloned',
      children: parseChildren(sortedClonedRepos, user.login)
    });
  }
}

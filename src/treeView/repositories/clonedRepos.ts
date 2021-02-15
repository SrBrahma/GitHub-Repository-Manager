import { commands, Uri, env, workspace } from 'vscode';
import { RepoItem } from './repoItem';
import { dataStore } from '../../store';
import { cloned } from '../../store/helpers';
import { UserStatus, Repository } from '../../store/types';
import { TreeItem } from '../base';

import path from 'path';
import { noLocalSearchPaths } from '../../utils/searchClonedRepos';

export function activateClonedRepos() {

  // Open
  commands.registerCommand('githubRepoMgr.commands.clonedRepos.open', ({ repo }: RepoItem) =>
    commands.executeCommand('vscode.openFolder', Uri.file(repo.localPath)));

  // Open in New Window
  commands.registerCommand('githubRepoMgr.commands.clonedRepos.openInNewWindow', ({ repo }: RepoItem) =>
    commands.executeCommand('vscode.openFolder', Uri.file(repo.localPath), true));

  // Add to Workspace
  commands.registerCommand('githubRepoMgr.commands.clonedRepos.addToWorkspace', ({ repo }: RepoItem) =>
    workspace.updateWorkspaceFolders(workspace.workspaceFolders.length, 0, { uri: Uri.file(repo.localPath) }));


  // Open Containing Folder
  commands.registerCommand('githubRepoMgr.commands.clonedRepos.openContainingFolder', ({ repo }: RepoItem) =>
    // revealFileInOS always open the parent path. So, to open the repo dir in fact, we pass the
    commands.executeCommand('revealFileInOS', Uri.file(path.resolve(repo.localPath, '.git'))));

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
  const user = dataStore.getState();
  if (user.status === UserStatus.logged) {
    const clonedRepos = user.organizations.map(org => cloned(org.repositories)).flat();
    const sortedClonedRepos = sortClonedRepos(clonedRepos, user.login);

    // TODO: Add remember cloned repos when not logged option?
    return new TreeItem({
      label: 'Cloned',
      children: noLocalSearchPaths
        ? [new TreeItem({ label: '"git.defaultCloneDirectory" is not set! Read the extension README!' })]
        : parseChildren(sortedClonedRepos, user.login)
    });
  }
}

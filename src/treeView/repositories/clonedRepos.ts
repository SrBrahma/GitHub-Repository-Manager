import { commands, Uri, env, workspace } from 'vscode';
import path from 'path';
import { RepoItem } from './repoItem';
import { TreeItem } from '../treeViewBase';
import { Repository } from '../../store/repository';
import { User } from '../../store/user';
import { noLocalSearchPaths } from '../../commands/utils/searchClonesRepos/searchClonedRepos';


export function activateClonedRepos(): void {
  // Open
  commands.registerCommand('githubRepoMgr.commands.clonedRepos.open', ({ repo }: RepoItem) =>
    repo.localPath && commands.executeCommand('vscode.openFolder', Uri.file(repo.localPath)));

  // Open in New Window
  commands.registerCommand('githubRepoMgr.commands.clonedRepos.openInNewWindow', ({ repo }: RepoItem) =>
    repo.localPath && commands.executeCommand('vscode.openFolder', Uri.file(repo.localPath), true));

  // Add to Workspace
  commands.registerCommand('githubRepoMgr.commands.clonedRepos.addToWorkspace', ({ repo }: RepoItem) =>
    repo.localPath && workspace.updateWorkspaceFolders(workspace.workspaceFolders?.length ?? 0, 0, { uri: Uri.file(repo.localPath) }));

  // Open Containing Folder
  commands.registerCommand('githubRepoMgr.commands.clonedRepos.openContainingFolder', ({ repo }: RepoItem) =>
    // revealFileInOS always open the parent path. So, to open the repo dir in fact, we pass the
    repo.localPath && commands.executeCommand('revealFileInOS', Uri.file(path.resolve(repo.localPath, '.git'))));

  // Copy local path to clipboard
  commands.registerCommand('githubRepoMgr.commands.clonedRepos.copyPath', ({ repo }: RepoItem) => {
    repo.localPath && void env.clipboard.writeText(repo.localPath);
  });
}

function parseChildren(clonedRepos: Repository[], userLogin: string): TreeItem | TreeItem[] {
  return clonedRepos.map(repo => new RepoItem({
    repo,
    contextValue: 'githubRepoMgr.context.clonedRepo',
    command: {
      // We wrap the repo in {} because we may call the cloneTo from the right click, and it passes the RepoItem.
      command: 'githubRepoMgr.commands.clonedRepos.open',
      arguments: [{ repo }],
    },
    includeOwner: repo.ownerLogin !== userLogin,
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

// TODO: Add remember cloned repos when not logged option?
export function getClonedTreeItem(): TreeItem {
  if (!User.login)
    throw new Error('User.login is not set!');
  const sortedClonedRepos = sortClonedRepos(User.clonedRepos, User.login);
  return new TreeItem({
    label: 'Cloned', // I tried a +(${User.clonedRepos.length}), but it made me a little anxious. Better not having it.
    children: noLocalSearchPaths
      ? new TreeItem({ label: '"git.defaultCloneDirectory" is not set! Read the extension README!' })
      : parseChildren(sortedClonedRepos, User.login),
  });
}

import { commands, Uri, env, workspace, ThemeIcon } from 'vscode';
import { RepoItem } from './repoItem';
import { user } from '../../User/User';
import { repositories, Repository } from '../../Repository/Repository';
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


// Just to use switch with return.
function getChildren(clonedRepos: Repository[]): TreeItem | TreeItem[] {
  switch (repositories.searchLocalReposStatus) {
    case repositories.SearchLocalReposStatus.searching:
      return new TreeItem({
        label: 'Searching for cloned repositories...',
        iconPath: new ThemeIcon('kebab-horizontal')
      });

    case repositories.SearchLocalReposStatus.noStartingSearchDirs:
      return new TreeItem({
        label: 'No directories to search found, please review your settings',
        iconPath: new ThemeIcon('x')
      });

    case repositories.SearchLocalReposStatus.noClonedReposFound:
      return new TreeItem({
        label: 'No cloned repositories found',
      });

    default:
    case repositories.SearchLocalReposStatus.ok:
      return clonedRepos.map(repo => new RepoItem({
        repo,
        contextValue: 'githubRepoMgr.context.clonedRepo',
        command: {
          // We wrap the repo in {} because we may call the cloneTo from the right click, and it passes the RepoItem.
          command: 'githubRepoMgr.commands.clonedRepos.open',
          arguments: [{ repo }]
        },
      }));
  }
}

export function getClonedTreeItem(clonedRepos: Repository[]): TreeItem | undefined {
  // TODO: Add remember cloned repos when not logged option?
  if (user.status === user.Status.logged) {
    let children = getChildren(clonedRepos);

    return new TreeItem({
      label: 'Cloned',
      children
    });
  }
}
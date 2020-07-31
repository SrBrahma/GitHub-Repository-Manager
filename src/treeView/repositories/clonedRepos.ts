import { commands, Uri, env, workspace, ThemeIcon } from 'vscode';
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

function parseChildren(clonedRepos: Repository[]): TreeItem | TreeItem[] {
  return clonedRepos.map(repo => new RepoItem({
    repo,
    contextValue: 'githubRepoMgr.context.clonedRepo',
    command: {
      // We wrap the repo in {} because we may call the cloneTo from the right click, and it passes the RepoItem.
      command: 'githubRepoMgr.commands.clonedRepos.open',
      arguments: [{ repo }]
    },
  }, true));
}

export function getClonedTreeItem(clonedRepos: Repository[]): TreeItem | undefined {
  const user = UserStore.getState();
  // TODO: Add remember cloned repos when not logged option?
  if (user.status === UserStatus.logged) {
    return new TreeItem({
      label: 'Cloned',
      children: parseChildren(user.organizations.map(org => cloned(org.repositories)).flat())
    });
  }

}
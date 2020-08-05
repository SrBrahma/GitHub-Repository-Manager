import { commands, Uri, env, workspace, ThemeIcon } from 'vscode';
import { RepoItem } from './repoItem';
import UserStore from '../../store';
import { cloned } from "../../store/helpers";
import { UserStatus, Repository } from '../../store/types';
import { TreeItem } from '../base';
import vscode from 'vscode';

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

function parseOrgRepos(clonedRepos: Repository[]): TreeItem | TreeItem[] {
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

export function getClonedTreeItem(): TreeItem | undefined {
  const user = UserStore.getState();
  // TODO: Add remember cloned repos when not logged option?
  if (user.status === UserStatus.logged) {
    const orgs: TreeItem[] = user.organizations.map((org) => {
      const repos = cloned(org.repositories);
      return new TreeItem({
        label: `${org.name}`,
        children: org.repositories.length ? parseOrgRepos(repos) : [new TreeItem({
          label: org.status,
        })],
        collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
      });
    });

    return new TreeItem({
      label: 'Cloned',
      children: orgs
    });
  }
}

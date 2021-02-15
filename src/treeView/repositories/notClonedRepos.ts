import { TreeItem } from '../base';
import { RepoItem } from './repoItem';
import { dataStore } from '../../store';
import { notCloned } from '../../store/helpers';
import { UserStatus, Repository, OrgStatus } from '../../store/types';
import { commands } from 'vscode';
import { uiCloneTo } from '../../uiCommands/uiCloneTo';
import vscode from 'vscode';

export function activateNotClonedRepos() {
  // Clone repo to [open select repo location]. You must pass the repo as arg.
  commands.registerCommand('githubRepoMgr.commands.notClonedRepos.cloneTo',
    ({ repo }: RepoItem) => uiCloneTo(repo));
}

function parseOrgRepos(repositories: Repository[]): RepoItem[] {
  return repositories.map(repo => new RepoItem({
    repo,
    contextValue: 'githubRepoMgr.context.notClonedRepo',
    command: {
      // We wrap the repo in {} because we may call the cloneTo from the right click, and it passes the RepoItem.
      command: 'githubRepoMgr.commands.notClonedRepos.cloneTo',
      arguments: [{ repo }]
    },
  }));
}

function getEmptyOrgLabel(status: OrgStatus): string {
  switch (status) {
  case OrgStatus.errorLoading:
    return 'Error loading';
  case OrgStatus.notLoaded: // Same as loading.
  case OrgStatus.loading:
    return 'Loading...';
  case OrgStatus.loaded:
    return 'Empty';
  }
}

export function getNotClonedTreeItem(): TreeItem | undefined {
  const user = dataStore.getState();

  if (user.status === UserStatus.logged) {
    const orgs: TreeItem[] = user.organizations.map((org) => {
      const repos = notCloned(org.repositories);
      return new TreeItem({
        label: `${org.name}`,
        children: (org.repositories.length
          ? parseOrgRepos(repos)
          : [new TreeItem({ label: getEmptyOrgLabel(org.status) })]),
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
      });
    });

    return new TreeItem({
      label: 'Not Cloned',
      children: orgs
    });
  }

  return undefined;
}
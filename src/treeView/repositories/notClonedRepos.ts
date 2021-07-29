import { TreeItem } from '../treeViewBase';
import { RepoItem } from './repoItem';
import vscode, { commands } from 'vscode';
import { uiCloneTo } from '../../commandsUi/uiCloneTo';
import { OrgStatus } from '../../store/organization';
import { User } from '../../store/user';


export function activateNotClonedRepos(): void {
  // Clone repo to [open select repo location]. You must pass the repo as arg.
  commands.registerCommand('githubRepoMgr.commands.notClonedRepos.cloneTo',
    ({ repo }: RepoItem) => uiCloneTo({
      name: repo.name, ownerLogin: repo.ownerLogin, reloadRepos: true,
    }));
}

// Much like unused right now. Orgs will always be loaded here.
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

export function getNotClonedTreeItem(): TreeItem {
  const orgs: TreeItem[] = User.organizations.map(org => {
    return new TreeItem({
      label: `${org.name}`,
      children: (org.repositories.length
        ? org.notClonedRepos.map(repo => new RepoItem({
          repo,
          contextValue: 'githubRepoMgr.context.notClonedRepo',
          command: {
            // We wrap the repo in {} because we may call the cloneTo from the right click, and it passes the RepoItem.
            command: 'githubRepoMgr.commands.notClonedRepos.cloneTo',
            arguments: [{ repo }],
          },
        }))
        : new TreeItem({ label: getEmptyOrgLabel(org.status) })),
      collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
    });
  });

  return new TreeItem({
    label: 'Not Cloned',
    children: orgs,
  });
}
import vscode, { commands } from 'vscode';
import type { Organization } from '../../store/organization';
import { uiCloneTo } from '../../uiCommands/uiCloneTo';
import { TreeItem } from '../treeViewBase';
import { RepoItem } from './repoItem';

export function activateNotClonedRepos(): void {
  // Clone repo to [open select repo location]. You must pass the repo as arg.
  commands.registerCommand(
    'githubRepoMgr.commands.notClonedRepos.cloneTo',
    ({ repo }: RepoItem<false, 'user-is-member'>) =>
      uiCloneTo({
        name: repo.name,
        ownerLogin: repo.ownerLogin,
        reloadRepos: true,
      }),
  );
}

export function getNotClonedTreeItem({
  userOrgs,
}: {
  userOrgs: Organization[];
}): TreeItem {
  const orgs: TreeItem[] = userOrgs.map((org) => {
    return new TreeItem({
      label: `${org.name}`,
      children: org.notClonedRepos.map(
        (repo) =>
          new RepoItem({
            repo,
            contextValue: 'githubRepoMgr.context.notClonedRepo',
            command: {
              // We wrap the repo in {} because we may call the cloneTo from the right click, and it passes the RepoItem.
              command: 'githubRepoMgr.commands.notClonedRepos.cloneTo',
              arguments: [{ repo }],
            },
          }),
      ),
      collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
    });
  });

  return new TreeItem({
    label: 'Not Cloned',
    children: orgs,
  });
}

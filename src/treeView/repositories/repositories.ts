import vscode, { commands, Uri, window, workspace } from 'vscode';
import { Configs } from '../../main/configs';
import { hasRepoRemote } from '../../store/repository';
import { RepositoriesState, User } from '../../store/user';
import { uiCreateRepo } from '../../uiCommands/uiCreateRepo';
import { BaseTreeDataProvider, TreeItem } from '../treeViewBase';
import {
  activateClonedRepos,
  getClonedOthersTreeItem,
  getClonedTreeItem,
} from './clonedRepos';
import { activateNotClonedRepos, getNotClonedTreeItem } from './notClonedRepos';
import type { RepoItem } from './repoItem';

export function activateTreeViewRepositories(): void {
  const repositoriesTreeDataProvider = new TreeDataProvider();

  vscode.window.registerTreeDataProvider(
    'githubRepoMgr.views.repositories',
    repositoriesTreeDataProvider,
  );

  User.subscribe('repos', () => {
    repositoriesTreeDataProvider.refresh();
  });

  // Access GitHub Web Page
  vscode.commands.registerCommand(
    'githubRepoMgr.commands.repos.openWebPage',
    ({ repo }: RepoItem) => {
      if (hasRepoRemote(repo))
        return vscode.commands.executeCommand(
          'vscode.open',
          vscode.Uri.parse(repo.url),
        );
    },
  );

  // Will have .git on the end.
  vscode.commands.registerCommand(
    'githubRepoMgr.commands.repos.copyRepositoryUrl',
    ({ repo }: RepoItem) => {
      if (hasRepoRemote(repo))
        return vscode.env.clipboard.writeText(`${repo.url}.git`);
    },
  );

  // Reload repos
  vscode.commands.registerCommand('githubRepoMgr.commands.repos.reload', () =>
    User.reloadRepos(),
  );

  // Create Repo
  vscode.commands.registerCommand('githubRepoMgr.commands.repos.createRepo', () =>
    uiCreateRepo(),
  );

  // Sets the default directory for cloning
  commands.registerCommand(
    'githubRepoMgr.commands.pick.defaultCloneDirectory',
    async () => {
      const thenable = await window.showOpenDialog({
        defaultUri: Uri.file(Configs.defaultCloneToDir),
        openLabel: `Select as default directory`,
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
      });

      if (thenable) {
        // 3rd param as true to change global setting. Else wouldn't work.
        await workspace
          .getConfiguration('git')
          .update('defaultCloneDirectory', thenable[0]!.fsPath, true);
        await User.reloadRepos();
      }
    },
  );

  activateClonedRepos();
  activateNotClonedRepos();
}

class TreeDataProvider extends BaseTreeDataProvider {
  constructor() {
    super();
  }

  getData() {
    switch (User.repositoriesState) {
      case RepositoriesState.none:
        return []; // So on not logged user it won't be 'Loading...' for ever.
      case RepositoriesState.fetching:
        return new TreeItem({
          label: 'Loading...',
        });
      case RepositoriesState.checkingDirtiness:
      case RepositoriesState.fullyLoaded: {
        const userLogin = User.login;
        if (!userLogin) throw new Error('User.login is not set!');

        const clonedFromOthers = User.otherLocalsRepos.length
          ? [getClonedOthersTreeItem({ repos: User.otherLocalsRepos })]
          : [];

        return [
          getClonedTreeItem({ repos: User.clonedRepos, userLogin }),
          ...clonedFromOthers,
          getNotClonedTreeItem({ userOrgs: User.organizations }),
        ];
      }
    }
  }

  protected makeData() {
    this.data = this.getData();
  }
}

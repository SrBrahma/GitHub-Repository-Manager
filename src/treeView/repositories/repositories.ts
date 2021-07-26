import vscode from 'vscode';
import { BaseTreeDataProvider, TreeItem } from '../treeViewBase';
import { RepoItem } from './repoItem';
import { getClonedTreeItem, activateClonedRepos } from './clonedRepos';
import { activateNotClonedRepos, getNotClonedTreeItem } from './notClonedRepos';
import { uiCreateRepo } from '../../commandsUi/uiCreateRepo';
import { RepositoriesState, User } from '../../store/user';
import path from 'path';
import { pathHasGit } from '../../commands/utils/pathHasGit/pathHasGit';


export function activateTreeViewRepositories(): void {
  const repositoriesTreeDataProvider = new TreeDataProvider();

  vscode.window.registerTreeDataProvider('githubRepoMgr.views.repositories',
    repositoriesTreeDataProvider);
  User.subscribe('repos', () => { repositoriesTreeDataProvider.refresh(); });

  // Access GitHub Web Page
  vscode.commands.registerCommand('githubRepoMgr.commands.repos.openWebPage', ({ repo }: RepoItem) =>
    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(repo.url)));

  // Will have .git on the end.
  vscode.commands.registerCommand('githubRepoMgr.commands.repos.copyRepositoryUrl', ({ repo }: RepoItem) =>
    vscode.env.clipboard.writeText(`${repo.url}.git`));

  // Reload repos
  vscode.commands.registerCommand('githubRepoMgr.commands.repos.reload', () => User.reloadRepos());

  // Create Repo
  vscode.commands.registerCommand('githubRepoMgr.commands.repos.createRepo', () => uiCreateRepo());

  type State = 'noGit' | 'gitNoRemote' | 'gitWithRemote';
  type Special = {
    workspaceFolder: vscode.WorkspaceFolder;
    state: State;
    disposable: () => void;
  };
  let workspaceFolderSpecial: Special[] = [];

  async function checkState(path: string): Promise<State> {
    const containsGit = await pathHasGit(path);
    if (!containsGit)
      return 'noGit';
    return 'gitWithRemote'; // TODO;
  }

  function updated() {
    const containsNoGit = workspaceFolderSpecial.find(w => w.state === 'noGit');
    const containsGitNoRemote = workspaceFolderSpecial.find(w => w.state === 'gitNoRemote');
    void vscode.commands.executeCommand('setContext', 'containsNoGit', containsNoGit);
    void vscode.commands.executeCommand('setContext', 'containsGitNoRemote', containsGitNoRemote);
    console.log(workspaceFolderSpecial);
  }

  async function resetGitWatcher() {
    workspaceFolderSpecial.forEach(w => w.disposable()); // dispose all
    workspaceFolderSpecial = []; // Reset
    const workspaceFolders = vscode.workspace.workspaceFolders ?? [];
    workspaceFolderSpecial = await Promise.all(workspaceFolders?.map(async workspaceFolder => {
      const watcher = vscode.workspace.createFileSystemWatcher(`${workspaceFolder.uri.path}/.git/**`);
      const newSpecial: Special = {
        workspaceFolder,
        disposable: watcher.dispose,
        state: await checkState(workspaceFolder.uri.fsPath),
      };
      const fun = async () => {
        newSpecial.state = await checkState(workspaceFolder.uri.fsPath);
        updated();
      };
      watcher.onDidChange(() => fun());
      watcher.onDidCreate(() => fun());
      watcher.onDidDelete(() => fun());
      return newSpecial;
    }));
    updated();
  }
  void resetGitWatcher(); // Run on start
  vscode.workspace.onDidChangeWorkspaceFolders(() => {
    void resetGitWatcher(); // Run on changes
  });

  vscode.commands.registerCommand('githubRepoMgr.commands.repos.createRepoWithCurrentFiles', () => {
    // vscode.window.showQuickPick()
    // console.log(vscode.workspace.workspaceFolders);
    // resetGitWatcher();
  },
  );

  activateClonedRepos();
  activateNotClonedRepos();
}



class TreeDataProvider extends BaseTreeDataProvider {
  constructor() { super(); }
  getData() {
    switch (User.repositoriesState) {
      case RepositoriesState.none:
        return []; // So on not logged user it won't be 'Loading...' for ever.
      case RepositoriesState.fetching:
        return new TreeItem({
          label: 'Loading...',
        });
      case RepositoriesState.partial:
      case RepositoriesState.fullyLoaded:
        return [getClonedTreeItem(), getNotClonedTreeItem()];
    }
  }
  protected makeData() {
    this.data = this.getData();
  }
}

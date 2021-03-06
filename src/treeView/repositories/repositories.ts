// Tree view base

import vscode from 'vscode';
import { BaseTreeDataProvider } from '../base';
import { dataStore } from '../../store';
import { reloadRepos } from '../../store/helpers';
import { RepoItem } from './repoItem';
import { getClonedTreeItem, activateClonedRepos } from './clonedRepos';
import { activateNotClonedRepos, getNotClonedTreeItem } from './notClonedRepos';
import { uiCreateRepo } from '../../uiCommands/uiCreateRepo';


export let repositoriesTreeDataProvider: TreeDataProvider;

export function activateTreeViewRepositories() {
  repositoriesTreeDataProvider = new TreeDataProvider();

  dataStore.subscribe(() => { repositoriesTreeDataProvider.refresh(); });

  vscode.window.registerTreeDataProvider('githubRepoMgr.views.repositories',
    repositoriesTreeDataProvider);

  // Access GitHub Web Page
  vscode.commands.registerCommand('githubRepoMgr.commands.repos.openWebPage', ({ repo }: RepoItem) =>
    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(repo.url)));

  // Will have .git on the end.
  vscode.commands.registerCommand('githubRepoMgr.commands.repos.copyRepositoryUrl', ({ repo }: RepoItem) =>
    vscode.env.clipboard.writeText(`${repo.url}.git`));

  // Reload repos
  vscode.commands.registerCommand('githubRepoMgr.commands.repos.reload', () =>
    reloadRepos());

  // Create Repo
  vscode.commands.registerCommand('githubRepoMgr.commands.repos.createRepo', () =>
    uiCreateRepo());

  activateClonedRepos();
  activateNotClonedRepos();
}


// There is a TreeItem from vscode. Should I use it? But it would need a workaround to
// avoid using title in command.
class TreeDataProvider extends BaseTreeDataProvider {

  constructor() {
    super();
  }

  protected makeData() {
    this.data = [getClonedTreeItem(), getNotClonedTreeItem()];
  }
}





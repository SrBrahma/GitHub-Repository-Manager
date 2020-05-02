// Actions should appear next to each item. Maybe it isnt possible

// context item:

// TODO: Find repositories (by dirs , with depth of 1.) Setting should have by default git.defaultCloneDirectory
// TODO: globalState with added repo path that may be outside the dirs above.
// TODO: on globalState paths check on startup, remove the key if repo isnt found.

// If already cloned:
// Open
// Open in New Window
// Add to Workspace
// Remove from Local Files (?)

// Not cloned:
// Link to already cloned repo -> add to globalState
// Clone [popup dest dir]
// Clone to <Default Dir>

// After cloning, show what to do with it dialogue (Open, new window, add to workspace, nothing(?))


import vscode from 'vscode';
import { TreeItem, BaseTreeDataProvider } from './base';
import { Repository, repositories } from '../Octokit/Repository';
import { cloneTo } from '../commands/cloneTo';


export let repositoriesTreeDataProvider: TreeDataProvider;

export function activateTreeViewRepositories() {
  repositoriesTreeDataProvider = new TreeDataProvider();

  vscode.window.registerTreeDataProvider('githubRepoMgr.views.repositories',
    repositoriesTreeDataProvider);

  // Clone repo to [open select repo location]. You must pass the repo as arg.
  vscode.commands.registerCommand('githubRepoMgr.commands.auth.cloneTo',
    (repo: Repository) => cloneTo(repo));
}



// There is a TreeItem from vscode. Should I use it? But it would need a workaround to
// avoid using title in command.
class TreeDataProvider extends BaseTreeDataProvider {

  constructor() {
    super();
  }

  protected makeData() {
    this.data = repositories.map(repo => new TreeItem({
      label: repo.name,
      command: {
        command: 'githubRepoMgr.commands.auth.cloneTo', arguments: [repo]
      }
    }));
  }
}



// interface RepoItemConstructor extends TreeItemConstructor {

// }
// class RepoItem extends TreeItem {
//   constructor({ label, children, command }: RepoItemConstructor) {
//     super({ label, children, command });
//   }
// }
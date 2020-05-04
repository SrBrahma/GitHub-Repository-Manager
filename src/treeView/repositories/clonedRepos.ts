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

export function getClonedTreeItem(clonedRepos: Repository[]): TreeItem | undefined {
  // TODO: Add remember cloned repos when not logged option?
  if (user.status === user.Status.logged) {
    let children: TreeItem | TreeItem[];

    if (repositories.isSearchingLocalRepos)
      children = new TreeItem({
        label: 'Searching for cloned repositories...',
        iconPath: new ThemeIcon('kebab-horizontal')
        // iconPath: new ThemeIcon('loading~spin') // spin doesn't seem to work at the current moment.
      });

    else
      children = clonedRepos.map(clonedRepo => new RepoItem({
        repo: clonedRepo,
        contextValue: 'githubRepoMgr.context.clonedRepo'
      }));

    return new TreeItem({
      label: 'Cloned',
      children
    });
  }
}
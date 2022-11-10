import path from 'path';
import fse from 'fs-extra';
import type { MessageItem } from 'vscode';
import { commands, env, ThemeIcon, Uri, window, workspace } from 'vscode';
import { isGitDirty } from '../../commands/git/dirtiness/dirtiness';
import { noLocalSearchPaths } from '../../commands/searchClonedRepos/searchClonedRepos';
import type { Repository } from '../../store/repository';
import { hasRepoRemote } from '../../store/repository';
import { User } from '../../store/user';
import { TreeItem } from '../treeViewBase';
import { RepoItem } from './repoItem';


export function activateClonedRepos(): void {
  // Open
  commands.registerCommand('githubRepoMgr.commands.clonedRepos.open', ({ repo }: RepoItem<true>) =>
    repo.localPath && commands.executeCommand('vscode.openFolder', Uri.file(repo.localPath)),
  );

  // Open in New Window
  commands.registerCommand('githubRepoMgr.commands.clonedRepos.openInNewWindow', ({ repo }: RepoItem<true>) =>
    commands.executeCommand('vscode.openFolder', Uri.file(repo.localPath), true),
  );

  // Add to Workspace
  commands.registerCommand('githubRepoMgr.commands.clonedRepos.addToWorkspace', ({ repo }: RepoItem<true>) =>
    workspace.updateWorkspaceFolders(workspace.workspaceFolders?.length ?? 0, 0, { uri: Uri.file(repo.localPath) }),
  );

  // Open Containing Folder
  commands.registerCommand('githubRepoMgr.commands.clonedRepos.openContainingFolder', ({ repo }: RepoItem<true>) =>
    // revealFileInOS always open the parent path. So, to open the repo dir in fact, we pass the
    commands.executeCommand('revealFileInOS', Uri.file(path.resolve(repo.localPath, '.git'))),
  );

  // Copy local path to clipboard
  commands.registerCommand('githubRepoMgr.commands.clonedRepos.copyPath', ({ repo }: RepoItem<true>) => {
    void env.clipboard.writeText(repo.localPath);
  });

  // Delete repo
  commands.registerCommand('githubRepoMgr.commands.clonedRepos.delete', async ({ repo }: RepoItem<true>) => {
    if (!repo.localPath)
      return; // DO nothing if repo hasn't local path
    const isDirty = await isGitDirty(repo.localPath);

    const title = isDirty ? `Delete DIRTY ${repo.name} repository?` : `Delete ${repo.name} repository?`;
    const message = isDirty
      ? `The repository is DIRTY; there are uncommitted local changes. Are you sure you want to locally delete this repository? This action is IRREVERSIBLE.`
      : `Are you sure you want to locally delete the repository? This action is irreversible.`;

    const deleteString = 'Delete';
    const answer = await window.showWarningMessage<MessageItem>(title,
      {
        detail: message,
        modal: true,
      },
      { title: 'Cancel', isCloseAffordance: true },
      { title: deleteString },
    );

    if (answer?.title === deleteString) {
      const disposable = window.setStatusBarMessage(`Locally deleting ${repo.name}...`);
      try {
        await fse.remove(repo.localPath);
        void window.showInformationMessage(`Locally deleted the ${repo.name} repository.`);
        await User.reloadRepos();
      } catch (err) {
        void window.showErrorMessage((err as any).message);
      } finally {
        disposable.dispose();
      }
    }
  });
}

function parseChildren(repos: Repository[]): TreeItem | TreeItem[] {
  return repos.map((repo) => new RepoItem({
    repo,
    contextValue: 'githubRepoMgr.context.clonedRepo',
    command: {
      // We wrap the repo in {} because we may call the cloneTo from the right click, and it passes the RepoItem.
      command: 'githubRepoMgr.commands.clonedRepos.open',
      arguments: [{ repo }],
    },
    includeOwner: false, // !!userLogin && repo.ownerLogin !== userLogin, // we disabled that
  }));
}

function sortClonedRepos<R extends Repository<true, 'user-is-member'>[]>(repos: R, userLogin: string): R {
  return repos.sort((a, b) => {

    // User repos comes first
    if (a.ownerLogin === userLogin && b.ownerLogin !== userLogin)
      return -1;
    if (a.ownerLogin !== userLogin && b.ownerLogin === userLogin)
      return 1;

    // Different Authors are sorted (ownerLogin === userLogin doesn't enter this block)
    if (a.ownerLogin !== b.ownerLogin)
      return (a.ownerLogin.toLocaleUpperCase() < b.ownerLogin.toLocaleUpperCase())
        ? -1 : 1;

    // If same owner login, repos are sorted by name.
    return (a.name.toLocaleUpperCase() < b.name.toLocaleUpperCase())
      ? -1 : 1;
  });
}

// TODO: Add remember cloned repos when not logged option?
export function getClonedTreeItem({ repos, userLogin }: {
  repos: Repository<true, 'user-is-member'>[];
  userLogin: string;
}): TreeItem {
  const sortedRepos = sortClonedRepos(repos, userLogin);
  return new TreeItem({
    label: 'Cloned',
    children: noLocalSearchPaths
      ? new TreeItem({
        label: ' Press here to select "git.defaultCloneDirectory"',
        command: 'githubRepoMgr.commands.pick.defaultCloneDirectory',
        iconPath: new ThemeIcon('file-directory'),
      })
      : parseChildren(sortedRepos),
  });
}


function sortOtherLocalRepos<R extends Repository<true, 'no-remote' | 'user-not-member'>[]>(repos: R): R {
  return repos.sort((a, b) => {
    const aHasRemote = hasRepoRemote(a);
    const bHasRemote = hasRepoRemote(b);

    // Repos with remote come first
    if (aHasRemote && !bHasRemote)
      return -1;
    if (!aHasRemote && bHasRemote)
      return 1;

    // If both repos have remote and diff owner name, sort by it
    // Different Authors are sorted
    if (aHasRemote && bHasRemote && a.ownerLogin !== b.ownerLogin)
      return (a.ownerLogin.toLocaleUpperCase() < b.ownerLogin.toLocaleUpperCase())
        ? -1 : 1;

    // If same owner login, repos are sorted by name.
    return (a.name.toLocaleUpperCase() < b.name.toLocaleUpperCase())
      ? -1 : 1;
  });
}

// TODO: Add remember cloned repos when not logged option?
export function getClonedOthersTreeItem({ repos }: {
  repos: Repository<true, 'no-remote' | 'user-not-member'>[];
}): TreeItem {
  const sortedRepos = sortOtherLocalRepos(repos);
  return new TreeItem({
    label: 'Cloned - Others',
    children: parseChildren(sortedRepos),
  });
}

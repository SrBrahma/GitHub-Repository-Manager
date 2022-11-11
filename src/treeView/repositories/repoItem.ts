import os from 'os';
import vscode, { ThemeColor } from 'vscode';
import type { Dirtiness } from '../../commands/git/dirtiness';
import type { Remote, Repository } from '../../store/repository';
import { hasRepoRemoteWithUserAccess, isRepoOnDisk } from '../../store/repository';
import type { TreeItemConstructor } from '../treeViewBase';
import { TreeItem } from '../treeViewBase';

// https://code.visualstudio.com/api/references/icons-in-labels

// TODO: Use GitHub icons (must resize them)
// we may use repo-cloned as icon for template.
function getIcon(repo: Repository): vscode.ThemeIcon | undefined {
  const args = ((): { name: string; color?: string } => {
    if (hasRepoRemoteWithUserAccess(repo)) {
      if (!isRepoOnDisk(repo))
        return { name: 'source-control', color: 'githubRepositoryManager.remote' };
      if (repo.isPrivate)
        return { name: 'lock', color: 'githubRepositoryManager.private' };
      else if (repo.isFork)
        return { name: 'repo-forked', color: 'githubRepositoryManager.fork' };
      // is then public
      else return { name: 'repo', color: 'githubRepositoryManager.public' };
    }
    return { name: 'symbol-folder', color: 'githubRepositoryManager.remote' };
  })();

  return new vscode.ThemeIcon(
    args.name,
    args.color ? new ThemeColor(args.color) : undefined,
  );
}

const dirtyToMessage: Record<Dirtiness, string> = {
  clean: '',
  dirty: 'This repository has local changes',
  error: 'An error happened while getting dirtiness state! Read extension Output!',
  unknown: "Checking if it's dirty...",
};

// TODO Maybe for windows it requires regex escape?
// os.homedir e.g. = linux: '/home/user'
const prettifyLocalPath = (path: string): string => {
  return path.replace(RegExp(`^${os.homedir()}`), '~');
};

// the | &nbsp; | adds a little more spacing.
function getTooltip(repo: Repository) {
  const repoWithUserAccess = hasRepoRemoteWithUserAccess(repo) ? repo : undefined;
  const R = (fun: (f: Repository<boolean, 'user-is-member'>) => string): string =>
    repoWithUserAccess ? fun(repoWithUserAccess) : '';

  const repoOnDisk = isRepoOnDisk(repo) ? repo : undefined;
  const D = (fun: (fun: Repository<true, Remote>) => string): string =>
    repoOnDisk ? fun(repoOnDisk) : '';

  const string =
    `
|     |     |     |
| --- | --- | --- |
**Name** | &nbsp; | ${repo.name}` +
    R((r) => `\r\n**Description** | &nbsp; | ${r.description || 'No description'}`) +
    R((r) => `\r\n**Author** | &nbsp; | ${r.ownerLogin}`) +
    R((r) => `\r\n**Visibility** | &nbsp; | ${r.isPrivate ? 'Private' : 'Public'}`) +
    R((r) => (r.languageName ? `\r\n**Language** | &nbsp; |${r.languageName}` : '')) +
    R((r) =>
      r.isFork
        ? `\r\n**Fork of** | &nbsp; | ${r.parentRepoOwnerLogin} / ${r.parentRepoName}`
        : '',
    ) +
    R((r) => `\r\n**Updated at** | &nbsp; | ${r.updatedAt.toLocaleString()}`) +
    R((r) => `\r\n**Created at** | &nbsp; | ${r.createdAt.toLocaleString()}`) +
    D((r) => `\r\n**Local path** | &nbsp; | ${prettifyLocalPath(r.localPath)}`) +
    D((r) =>
      r.dirty !== 'clean'
        ? `\r\n**Dirty** | &nbsp; | ${dirtyToMessage[r.dirty]}`
        : '',
    );

  return new vscode.MarkdownString(string);
}

const dirtyToChar: Record<Dirtiness, string> = {
  clean: '',
  dirty: '*',
  error: 'E',
  unknown: '?',
};

type RepoItemConstructor<OnDisk extends boolean, R extends Remote> = Omit<
  TreeItemConstructor,
  'label'
> & {
  repo: Repository<OnDisk, R>;
  includeOwner?: boolean;
};

export class RepoItem<
  OnDisk extends boolean = boolean,
  R extends Remote = Remote,
> extends TreeItem {
  repo: Repository<OnDisk, R>;

  constructor({
    repo,
    command,
    includeOwner,
    ...rest
  }: RepoItemConstructor<OnDisk, R>) {
    const repoName = repo.name;

    let description = '';
    if (isRepoOnDisk(repo)) description += dirtyToChar[repo.dirty];

    super({
      label: repoName,
      tooltip: getTooltip(repo),
      command,
      iconPath: getIcon(repo),
      description: description || undefined, // '' to undefined.
    });
    Object.assign(this, rest);
    this.repo = repo;
  }
}

import os from 'os';
import vscode, { ThemeColor } from 'vscode';
import type { Dirtiness } from '../../commands/git/dirtiness/dirtiness';
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
  error:
    'An error has happened while getting dirtiness state! Read extension Output!',
  unknown: "Checking if it's dirty...",
};

// + (repo.isTemplate ? ' | Template' : '') //TODO
function getTooltip(repo: Repository) {
  // the | &nbsp; | adds a little more spacing.
  const R = hasRepoRemoteWithUserAccess(repo) ? repo : undefined;
  const D = isRepoOnDisk(repo) ? repo : undefined;
  // TODO Maybe for windows it requires regex escape?
  // os.homedir e.g. = linux: '/home/user'
  const localPath = !D
    ? undefined
    : D.localPath.replace(RegExp(`^${os.homedir()}`), '~');

  const string =
    `
|     |     |     |
| --- | --- | --- |
**Name** | &nbsp; | ${repo.name}` +
    (!R
      ? ''
      : `\r\n**Description** | &nbsp; | ${
          R.description ? R.description : 'No description'
        }`) +
    (!R ? '' : `\r\n**Author** | &nbsp; | ${R.ownerLogin}`) +
    (!R
      ? ''
      : `\r\n**Visibility** | &nbsp; | ${R.isPrivate ? 'Private' : 'Public'}`) +
    (!R ? '' : R.languageName ? `\r\n**Language** | &nbsp; |${R.languageName}` : '') +
    (!R
      ? ''
      : R.isFork
      ? `\r\n**Fork of** | &nbsp; | ${R.parentRepoOwnerLogin} / ${R.parentRepoName}`
      : '') +
    (!R ? '' : `\r\n**Updated at** | &nbsp; | ${R.updatedAt}`) +
    (!R ? '' : `\r\n**Created at** | &nbsp; | ${R.createdAt}`) +
    (!D ? '' : `\r\n**Local path** | &nbsp; | ${localPath}`) +
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    (!D
      ? ''
      : D.dirty !== 'clean'
      ? `\r\n**Dirty** | &nbsp; | ${dirtyToMessage[D.dirty]}`
      : '');

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

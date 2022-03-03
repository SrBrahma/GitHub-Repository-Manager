import os from 'os';
import vscode, { ThemeColor } from 'vscode';
import type { Dirtiness } from '../../commands/git/dirtiness/dirtiness';
import { Configs } from '../../main/configs';
import type { Repository } from '../../store/repository';
import type { TreeItemConstructor } from '../treeViewBase';
import { TreeItem } from '../treeViewBase';

// https://code.visualstudio.com/api/references/icons-in-labels

// TODO: Use GitHub icons (must resize them)
// we may use repo-cloned as icon for template.
function getIcon(repo: Repository) {
  const args = ((): [name: string, color: string | undefined] => {
    if (repo.isPrivate)
      return ['lock', 'githubRepositoryManager.private'];
    else if (repo.isFork)
      return ['repo-forked', 'githubRepositoryManager.fork'];
    else // is then public
      return ['repo', 'githubRepositoryManager.public'];
  })();
  return new vscode.ThemeIcon(
    args[0],
    (Configs.coloredIcons && args[1]) ? new ThemeColor(args[1]) : undefined,
  );
}


const dirtyToMessage: Record<Dirtiness, string> = {
  clean: '',
  dirty: 'This repository has local changes',
  error: 'An error has happened while getting dirtiness state! Read extension Output!',
  unknown: 'Checking if it\'s dirty...',

};
// + (repo.isTemplate ? ' | Template' : '') //TODO
function getTooltip(repo: Repository) {
  // TODO Maybe for windows it requires regex escape?
  // os.homedir e.g. = linux: '/home/user'
  const localPath = repo.localPath?.replace(RegExp(`^${os.homedir()}`), '~') ?? '';

  // the | &nbsp; | adds a little more spacing.
  const string = `
|     |     |     |
| --- | --- | --- |
**Name** | &nbsp; | ${repo.name}
**Description** | &nbsp; | ${repo.description ? repo.description : 'No description'}
**Author** | &nbsp; | ${repo.ownerLogin}
**Visibility** | &nbsp; | ${repo.isPrivate ? 'Private' : 'Public'}`

+ (repo.languageName ? `\r\n**Language** | &nbsp; |${repo.languageName}` : '')

+ (repo.isFork ? `\r\n**Fork of** | &nbsp; | ${repo.parentRepoOwnerLogin} / ${repo.parentRepoName}` : '')
+ `\r\n**Updated at** | &nbsp; | ${repo.updatedAt.toLocaleString()}`
+ `\r\n**Created at** | &nbsp; | ${repo.createdAt.toLocaleString()}`
+ (repo.localPath ? `\r\n**Local path** | &nbsp; | ${localPath}` : '')
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
+ ((repo.dirty && repo.dirty !== 'clean') ? `\r\n**Dirty** | &nbsp; | ${dirtyToMessage[repo.dirty ?? 'clean']}` : '');

  return new vscode.MarkdownString(string);
}


type RepoItemConstructor = Omit<TreeItemConstructor, 'label'> & {
  repo: Repository;
  includeOwner?: boolean;
};

const dirtyToChar: Record<Dirtiness, string> = {
  clean: '',
  dirty: '*',
  error: 'E',
  unknown: '?',
};

export class RepoItem extends TreeItem {
  repo: Repository;

  constructor({ repo, command, includeOwner, ...rest }: RepoItemConstructor) {
    const repoName = includeOwner ? `${repo.ownerLogin} / ${repo.name}` : repo.name;

    let description = '';
    // if (Math.random() > 0.8) // Favorite
    //   description += 'F ';
    if (repo.dirty)
      description += dirtyToChar[repo.dirty];

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
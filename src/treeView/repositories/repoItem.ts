
import { Repository } from '../../store/types';
import vscode from 'vscode';
import { TreeItem, TreeItemConstructor } from '../base';

// https://code.visualstudio.com/api/references/icons-in-labels

// TODO: Use GitHub icons (must resize them)
// we may use repo-cloned as icon for template.
function getIcon(repo: Repository) {
  let iconName;
  if (repo.isPrivate)
    iconName = 'lock';
  else if (repo.isFork)
    iconName = 'repo-forked';
  else
    iconName = 'repo';
  return new vscode.ThemeIcon(iconName);
}


// + (repo.isTemplate ? ' | Template' : '') //TODO
function getTooltip(repo: Repository) {
  // the | &nbsp; | adds a little more spacing.
  const tooltip = new vscode.MarkdownString(`
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
    + (repo.dirty === 'dirty' ? `\r\n**Dirty** | &nbsp; | This repository has local changes` : '')
  );
  return tooltip;
}


interface RepoItemConstructor extends TreeItemConstructor {
  repo: Repository;
  includeOwner?: boolean;
}

export class RepoItem extends TreeItem {
  repo: Repository;

  constructor({ repo, command, includeOwner, ...rest }: RepoItemConstructor) {
    const isCloned = !!repo.localPath;

    const repoName = includeOwner ? `${repo.ownerLogin} / ${repo.name}` : repo.name;
    let label = repoName;
    if (isCloned) {
      if (repo.dirty === 'dirty')
        label += ' *';
    }
    super({
      label: label,
      tooltip: getTooltip(repo),
      command,
      iconPath: getIcon(repo),
    });
    Object.assign(this, rest);
    this.repo = repo;
  }
}
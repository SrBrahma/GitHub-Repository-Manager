import { Repository } from "../../Repository/Repository";
import vscode from 'vscode';
import { TreeItem, TreeItemConstructor } from "../base";

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


// TODO: is template (how to, via octokit? this isnt returned in the
// current used request. maybe graphql?) Update: yes graphql allow isTemplate.
function getTooltip(repo: Repository) {
  let tooltip = ''
    + `\r\n${repo.name}`
    + (`\r\n${repo.description || 'No description.'}`)
    + `\r\n${repo.ownerLogin}`
    + `\r\n${repo.isPrivate ? 'Private' : 'Public'}`
    + (repo.language
      ? `\r\n${repo.language}`
      : '')
    + (repo.isFork
      ? `\r\nFork of: TODO`
      : '');
  return tooltip;
}


interface RepoItemConstructor extends TreeItemConstructor {
  repo: Repository;
}

export class RepoItem extends TreeItem {
  repo: Repository;

  constructor({ repo, command, ...rest }: RepoItemConstructor) {
    super({
      label: repo.name,
      tooltip: getTooltip(repo),
      command,
      iconPath: getIcon(repo),
    });
    Object.assign(this, rest);
    this.repo = repo;
  }
}

import { Repository } from "../../store/types";
import vscode from 'vscode';
import { TreeItem, TreeItemConstructor } from "../base";
import { stringInsert } from "../../aux";

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


function getTooltip(repo: Repository) {
  let tooltip = ''
    + `\r\Name              :  ${repo.name}`

    + `\r\nDescription :  ${repo.description ? repo.description : 'No description'}`

    + `\r\nAuthor           :  ${repo.ownerLogin}`

    + `\r\nVisibility        :  ${repo.isPrivate ? 'Private' : 'Public'}`
    // + (repo.isTemplate ? ' | Template' : '') //TODO

    + (repo.languageName ? `\r\nLanguage     :  ${repo.languageName}` : '')

    + (repo.isFork ? `\r\nFork of           :  ${repo.parentRepoOwnerLogin} / ${repo.parentRepoName}` : '')
    + `\r\nUpdated at  :  ${repo.updatedAt.toLocaleString()}`
    + `\r\nCreated at    :  ${repo.createdAt.toLocaleString()}`

    ;
  return tooltip;
}


interface RepoItemConstructor extends TreeItemConstructor {
  repo: Repository;
}

export class RepoItem extends TreeItem {
  repo: Repository;

  constructor({ repo, command, ...rest }: RepoItemConstructor) {
    super({
      label: `${repo.ownerLogin}/${repo.name}`,
      tooltip: getTooltip(repo),
      command,
      iconPath: getIcon(repo),
    });
    Object.assign(this, rest);
    this.repo = repo;
  }
}


// Not used. For > 2 lines, it breaks at different locations, as the font is not monospaced.
// // Avoid too large tooltips by breaking lines
// function formatText(string: string) {
//   // return string;
//   const maxCharsPerLine = 70;

//   const preNewLine = '\r\n';
//   const preNewLineDash = '-\r\n';

//   const posNewLine = '  ';

//   let i = maxCharsPerLine - 1;
//   while (i < string.length) {
//     if (string[i] !== ' ') {
//       string = stringInsert(string, i, preNewLineDash);
//       i += preNewLineDash.length;
//     }
//     else {
//       string = stringInsert(string, i, preNewLine);
//       i += preNewLine.length;
//     }

//     string = stringInsert(string, i, posNewLine);
//     i += posNewLine.length;

//     i += maxCharsPerLine;
//   }

//   return string;
// }
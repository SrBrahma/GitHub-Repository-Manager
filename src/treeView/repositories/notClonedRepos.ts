import { TreeItem } from "../base";
import { Repository } from "../../Repository/Repository";
import { RepoItem } from "./repoItem";
import { user } from "../../User/User";
import { commands } from "vscode";
import { uiCloneTo } from "../../uiCommands/uiCloneTo";

export function activateNotClonedRepos() {
  // Clone repo to [open select repo location]. You must pass the repo as arg.
  commands.registerCommand('githubRepoMgr.commands.notClonedRepos.cloneTo',
    ({ repo }: RepoItem) => uiCloneTo(repo));
}

export function getNotClonedTreeItem(notClonedRepos: Repository[]): TreeItem | undefined {
  if (user.status === user.Status.logged) {
    const repoItems = notClonedRepos.map(repo => new RepoItem({
      repo,
      contextValue: 'githubRepoMgr.context.notClonedRepo',
      command: {
        // We wrap the repo in {} because we may call the cloneTo from the right click, and it passes the RepoItem.
        command: 'githubRepoMgr.commands.notClonedRepos.cloneTo', arguments: [{ repo }]
      },
    }));

    return new TreeItem({
      label: 'Not Cloned',
      children: repoItems
    });
  }
}
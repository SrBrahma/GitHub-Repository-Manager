import { TreeItem } from "../base";
import { Repository } from "../../Repository/Repository";
import { RepoItem } from "./repoItem";
import DataStore from "../../DataStore";
import { UserStatus } from "../../DataStore/types";
import { commands } from "vscode";
import { uiCloneTo } from "../../uiCommands/uiCloneTo";
import vscode from 'vscode';

export function activateNotClonedRepos() {
  // Clone repo to [open select repo location]. You must pass the repo as arg.
  commands.registerCommand('githubRepoMgr.commands.notClonedRepos.cloneTo',
    ({ repo }: RepoItem) => uiCloneTo(repo));

  commands.registerCommand('githubRepoMgr.commands.notClonedRepos.expandOrg', (({ org }) => {
    console.log(org);
  }));
}

export function getNotClonedTreeItem(notClonedRepos: Repository[]): TreeItem | undefined {
  // if (user.status === user.Status.logged) {
  //   const repoItems = notClonedRepos.map(repo => new RepoItem({
  //     repo,
  //     contextValue: 'githubRepoMgr.context.notClonedRepo',
  //     command: {
  //       // We wrap the repo in {} because we may call the cloneTo from the right click, and it passes the RepoItem.
  //       command: 'githubRepoMgr.commands.notClonedRepos.cloneTo', arguments: [{ repo }]
  //     },
  //   }));

  //   return new TreeItem({
  //     label: 'Not Cloned',
  //     children: repoItems
  //   });
  // }

  const user = DataStore.getState();

  if (user.status === UserStatus.logged) {
    const orgs = user.organizations.map((org) => {
      return new TreeItem({
        label: `${org.name} (${org.status})`,
        children: [],
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        command: {
          command: 'githubRepoMgr.commands.notClonedRepos.expandOrg',
          arguments: [{ org }]
        },
      });
    });

    return new TreeItem({
      label: 'Not Cloned',
      children: orgs
    });
  }

  return undefined;
}
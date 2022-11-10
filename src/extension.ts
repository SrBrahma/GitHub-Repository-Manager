import type vscode from 'vscode';
import { Storage } from './main/storage';
import { User } from './store/user';
import { Workspace } from './store/workspace';
import { activateTreeViewAccount } from './treeView/account/account';
import { activateTreeViewRepositories } from './treeView/repositories/repositories';

// This method is called when your extension is activated
// your extension is activated the very first time the command is executed

export function activate(context: vscode.ExtensionContext): void {
  Storage.activate(context);
  void User.activate(); // No errors to catch.
  activateTreeViewAccount();
  activateTreeViewRepositories();
  Workspace.activate();
}

// this method is called when your extension is deactivated
export function deactivate(): void {
  Workspace.deactivate();
}

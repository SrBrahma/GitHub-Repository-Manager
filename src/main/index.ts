import type vscode from 'vscode';
import { User } from '../store/user';
import { activateTreeViewAccount } from '../treeView/account/account';
import { activateTreeViewRepositories } from '../treeView/repositories/repositories';
import { Storage } from './storage';

// This method is called when your extension is activated
// your extension is activated the very first time the command is executed

export function activate(context: vscode.ExtensionContext): void {
  Storage.activate(context);
  User.activate();
  activateTreeViewAccount();
  activateTreeViewRepositories();
}

// this method is called when your extension is deactivated
export function deactivate(): void {}

import vscode from 'vscode';
import { activateTreeViewAccount } from './treeView/account/account';
import { activateTreeViewRepositories } from './treeView/repositories/repositories';
import { Storage } from './main/storage';
import { User } from './store/user';


// This method is called when your extension is activated
// your extension is activated the very first time the command is executed

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function activate(context: vscode.ExtensionContext): void {
  Storage.activate(context);
  void User.activate(); // No errors to catch.
  activateTreeViewAccount();
  activateTreeViewRepositories();
}


// this method is called when your extension is deactivated
export function deactivate(): void {
  //
}

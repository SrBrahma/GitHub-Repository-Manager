import { envPath } from './consts';
import dotenv from 'dotenv';
dotenv.config({ path: envPath }); // Path was wrong without manually setting it.

import vscode from 'vscode';
import { Storage } from './storage';
import { activateTreeViewAccount } from './treeView/account/account';
import { activateTreeViewRepositories } from './treeView/repositories/repositories';
import { activateOctokit } from './octokit/octokit';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  Storage.activate(context);
  activateTreeViewAccount();
  activateTreeViewRepositories();
  activateOctokit();
}


// this method is called when your extension is deactivated
export function deactivate() {
  //
}

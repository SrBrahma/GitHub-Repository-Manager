// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { envPath } from './consts';
import dotenv from 'dotenv';
dotenv.config({ path: envPath }); // Path was wrong, without manually setting it.

import * as vscode from 'vscode';
import { storage } from './storage';
import { activateTreeViewAccount } from './treeView/account';
import { activateTreeViewRepositories } from './treeView/repositories';
import { activateOctokit } from './Octokit/octokit';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  storage.activate(context);
  activateTreeViewAccount();
  activateTreeViewRepositories();
  activateOctokit();
};


// this method is called when your extension is deactivated
export function deactivate() { }

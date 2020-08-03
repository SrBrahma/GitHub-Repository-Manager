import { Octokit } from "@octokit/rest";
import { loadUser, loadRepos, logout } from "../store/helpers";
import { storage } from '../storage';
import { configs } from '../configs';
import vscode from 'vscode';

export let octokit: Octokit | null = null;
export let token = '';

/**
 * Automatically enters the token, if .env or stored token.
 *
 * @export
 */
export function activateOctokit(): void {
  let token = '';
  if (process.env.USE_ENV_TOKEN === 'true')
    token = process.env.TOKEN;
  else if (configs.saveToken)
    token = storage.loadToken();

  if (token)
    initOctokit(token);
}

export async function initOctokit(tokenArg: string): Promise<void> {
  octokit = new Octokit({
    auth: tokenArg,
  });

  try {
    await loadUser();
    await loadRepos();
  }

  catch (err) {
    vscode.window.showErrorMessage(err.message);
    console.error('Octokit init error: ', err);
    octokit = null;
    return;
  }
  token = tokenArg;
  if (configs.saveToken) // 'If setting', store the token.
    storage.storeToken(tokenArg);
}

export function logoutAndForgetToken(): void {
  storage.removeToken();
  logout();
}
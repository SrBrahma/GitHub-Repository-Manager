import { Octokit } from '@octokit/rest';
import { notLoggedUser, reloadRepos } from '../store/helpers';
import vscode from 'vscode';
import { Auth } from './auth';
import { dataStore } from '../store';

export let octokit: Octokit | null = null;
export let token = '';

let mayBeLogged = false;
/**
 * Automatically enters the token, if .env or stored token.
 *
 * @export
 */
export async function activateOctokit(): Promise<void> {
  try {
    let token;

    if (process.env.USE_ENV_TOKEN === 'true')
      token = process.env.TOKEN;

    token = await Auth.init();

    // Init octokit if we have a local stored token
    if (token)
      initOctokit(token);

    else
      dataStore.dispatch({ type: 'UPDATE_USER', value: notLoggedUser() });

  } catch (err) {
    vscode.window.showErrorMessage(err.message);
    console.error('activateOctokit error: ', err);
    dataStore.dispatch({ type: 'UPDATE_USER', value: notLoggedUser() });
  }
}

export async function initOctokit(tokenArg: string): Promise<void> {
  octokit = new Octokit({
    auth: tokenArg,
  });

  // As the user may logout just after logging in, we add this to prevent the error box.
  mayBeLogged = true;
  try {
    await reloadRepos();
  } catch (err) {
    if (mayBeLogged) {
      vscode.window.showErrorMessage(err.message);
      console.error('Octokit init error: ', err);
    }
    octokit = null;
    return;
  }
  token = tokenArg;
}

export function logoutAndForgetToken(): void {
  mayBeLogged = false;
  dataStore.dispatch({ type: 'UPDATE_USER', value: notLoggedUser() });
  Auth.logout();
}
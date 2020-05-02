import vscode, { workspace } from 'vscode';
import { Octokit } from "@octokit/rest";

import { Repository, setRepositories } from "./Repository";
import { repositoriesTreeDataProvider } from "../treeView/repositories";
import { user } from "./User";
import { accountTreeDataProvider } from "../treeView/account";
import { storage } from '../storage';
import { upperCaseFirstLetter } from '../aux';
import { configs } from '../configurations';



export let octokit: Octokit | null = null;
export let token = '';



/**
 * Automatically enters the token, if .env or stored token.
 *
 * @export
 */
export function activateOctokit() {
  let token;
  if (process.env.USE_ENV_TOKEN === 'true')
    token = process.env.TOKEN;
  else if (configs.saveToken)
    token = storage.loadToken();

  if (token)
    initOctokit(token);
}



export async function initOctokit(tokenArg: string) {
  octokit = new Octokit({
    auth: tokenArg,
  });

  try {
    reloadUser();
    reloadRepos();
  }

  catch (error) {
    octokit = null;
    return;
  }

  token = tokenArg;
  if (configs.saveToken) // 'If setting', store the token.
    storage.storeToken(tokenArg);
}

export function logoutAndForgetToken() {
  storage.removeToken();
  user.status = user.Status.notLogged;
  setRepositories([]);
  accountTreeDataProvider.refresh();
  repositoriesTreeDataProvider.refresh();
}



/**
 * @export
 * @param {string} [token] If token isn't passed, will use the one in user.token.
 */
export async function reloadUser() {
  try {
    user.status = user.Status.logging;
    accountTreeDataProvider.refresh();
    await downloadUser();
    user.status = user.Status.logged;
    accountTreeDataProvider.refresh();
  }
  catch (error) {
    user.status = user.Status.errorLogging;
    vscode.window.showErrorMessage(error.message);
    accountTreeDataProvider.refresh();
    throw new Error(error);
  }
}

export async function reloadRepos() {
  try {
    await downloadRepos();
    repositoriesTreeDataProvider.refresh();
  }
  catch (error) {
    vscode.window.showErrorMessage(error.message);
    throw new Error(error);
  }
}



async function downloadUser() {
  try {
    const { data: userData } = await octokit.request('/user');
    user.name = userData.name;
    user.login = userData.login;
    user.avatarUri = userData.avatar_url;
    user.profileUri = userData.html_url;
  }
  catch (error) { // Octokit has a pattern for errors, which we display properly at octokitErrorDisplay().
    throw new Error(getOctokitErrorMessage(error));
  }
}

// could use graphql to reduce net usage.
async function downloadRepos() {
  try {
    const { data: reposData } = await octokit.repos.listForAuthenticatedUser();
    const repos = reposData.map(repoData => new Repository({
      name: repoData.name,
      description: repoData.description,
      ownerLogin: repoData.owner.login,
      language: repoData.language
    }));
    setRepositories(repos);
  }
  catch (error) { // Octokit has a patter for errors, which we display properly at octokitErrorDisplay().
    throw new Error(getOctokitErrorMessage(error));
  }
}



// We change a little the default error octokit outputs.
function getOctokitErrorMessage(error: any) {
  function defaultErrorMsg() {
    // name + code + : + message Ex: Http Error 500: Bla bla bla
    return `${error.name} ${error.status} : ${upperCaseFirstLetter(error.message)}`;
  }
  function customErrorMsg(msg: string) {
    return `${msg} ${defaultErrorMsg()}`;
  }

  let errorMessage = '';
  switch (error.status) {
    case 401:
      errorMessage = customErrorMsg('Looks like the provided token is wrong!'); break;
    case 500:
      errorMessage = customErrorMsg('Looks like your internet is off!'); break;
    default:
      errorMessage = defaultErrorMsg();
  }
  return errorMessage;
}

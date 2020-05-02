import {
  oauthCallbackPort, authCallbackPath, srcPath, callbackPagePath
} from '../consts';

import * as vscode from "vscode";
import querystring from 'querystring';
import express from 'express';
import path from 'path';
import { Octokit } from '@octokit/rest';
import { initOctokit } from '../Octokit/octokit';


let expressApp: express.Express | null = null;

// https://developer.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/
const oauthUri = `https://micro-github.srbrahma.now.sh/api/login?scope=repo`;


/**
 * Also starts the server.
 * @export
 */
export function openOAuthWebPage() {
  vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(oauthUri));
  openServer();
}


/**
 * Also starts the server.
 * @export
 */
export function copyOAuthLinkToClipboard() {
  vscode.env.clipboard.writeText(oauthUri);
  openServer();
}


function openServer() {
  if (expressApp)
    return;

  expressApp = express().use(express.json());
  expressApp.listen(oauthCallbackPort);

  // Handles the callback from the server, that contains the token or error.
  expressApp.get(authCallbackPath, (req, res) => {
    const { token, error } = req.query as { token?: string, error?: string; };
    if (token) {
      res.redirect(`http://localhost:${oauthCallbackPort}${callbackPagePath}`);
      initOctokit(token);
    }
    else
      res.send(error); // TODO: Could be better.

    closeServer();
  });

  // Just to remove the URI with the token. This is a success page.
  expressApp.get(callbackPagePath, (req, res) => {
    res.sendFile(path.resolve(srcPath, 'auth', 'callbackPage.html'));
  });

}

function closeServer() {
  expressApp.removeAllListeners(); // Maybe isn't needed.
  expressApp = null;
}


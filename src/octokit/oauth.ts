import { oauthCallbackPort, authCallbackPath, callbackPagePath } from '../consts';
import vscode, { window } from "vscode";
import express from 'express';
import { initOctokit } from './octokit';


// Thanks to Settings-Sync extension where I learned how they made the OAuth authorization
// (and to many other extensions where I learned lots of stuff to get this done)
// They however exposes publicly the clientId and clientSecret in the code. I decidede to
// use Vercel, which handles the communication with GitHub api.


let expressApp: express.Express | null = null;

const oauthUri = `https://micro-github.srbrahma.now.sh/api/login`;

/**
 * Also starts the server.
 * @export
 */
export async function openOAuthWebPage() {
  try {
    await openServer();
    vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(oauthUri));
  }
  catch (error) {
    window.showErrorMessage(error);
  }
}


/**
 * Also starts the server.
 * @export
 */
export async function copyOAuthLinkToClipboard() {
  try {
    await openServer();
    vscode.env.clipboard.writeText(oauthUri);
  }
  catch (error) {
    window.showErrorMessage(error);
  }
}


async function openServer(): Promise<void> {

  function asyncListen(port: number) { // https://github.com/nodejs/node/issues/21482#issuecomment-626025579
    return new Promise((resolve, reject) => {
      expressApp.listen(port)
        .once('listening', resolve)
        .once('error', reject);
    });
  }

  if (expressApp) // Server already running
    return;

  expressApp = express().use(express.json());

  try {
    await asyncListen(oauthCallbackPort);
  }
  catch (error) {
    throw new Error(error);
  }

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
    res.send(callbackHtmlPage);
  });

}

function closeServer() {
  expressApp.removeAllListeners(); // Maybe isn't needed.
  expressApp = null;
}

const callbackHtmlPage = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Auth Success!</title>
  </head>

  <body>
    <div>
      <h2>GitHub Repository Manager</h2>
      <h1>Authorization Succeeded!</h1>
      <h3>You can close this page.</h3>
    </div>

    <style>
      html,
      body {
        background-color: #e6dcdc;
        color: #495c6b;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 95%;
      }
      div {
        display: flex;
        flex-direction: column;
        text-align: center;
      }
    </style>
  </body>
</html>
`;


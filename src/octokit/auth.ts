import * as vscode from 'vscode';

// Based on https://github.com/microsoft/vscode-pull-request-github/blob/master/src/github/credentials.ts

const AUTH_PROVIDER_ID = 'github';
const SCOPES = ['repo', 'read:org'];

class AuthClass {
  sessionId: string | null;

  /** Returns the stored token or null if none. May throw errors. */
  async init(): Promise<string | null> {
    const session = await vscode.authentication.getSession(AUTH_PROVIDER_ID, SCOPES, { createIfNone: false });
    // currently the typing of session here is wrongly a truthy value (vscode .d.ts fault), but may be falsy if no token is stored.
    if (session) {
      const token = session.accessToken;
      this.sessionId = session.id;
      return token;
    }
    else
      return null;

  }

  /** Returns the new authed token. May throw errors. */
  async authenticate(): Promise<string> {
    const session = await vscode.authentication.getSession(AUTH_PROVIDER_ID, SCOPES, { createIfNone: true });
    // Isn't clear if session may be undefined or not. We check it anyway.

    const token = session.accessToken;
    this.sessionId = session.id;
    return token;
  }

  logout() {
    // logout isn't defined but is used in https://github.com/microsoft/vscode-pull-request-github/blob/master/src/github/credentials.ts
    if (this.sessionId)
      (vscode.authentication as any).logout(AUTH_PROVIDER_ID, this.sessionId);
  }
}

export const Auth = new AuthClass();




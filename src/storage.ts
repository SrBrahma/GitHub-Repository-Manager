import vscode from 'vscode';
import { configs } from './configs';

// TODO: extension version
export namespace storage {

  let context: vscode.ExtensionContext;

  const keys = {
    token: 'token'
  };


  /**
   * Passes the context, and also removes the current stored token if saveToken configuration is false.
   * For this token behavior, this must be executed before octokit stuff.
   *
   * @export
   * @param {vscode.ExtensionContext} contextArg
   */
  export function activate(contextArg: vscode.ExtensionContext) {
    context = contextArg;

    if (!configs.saveToken && loadToken())
      removeToken();
  }

  // https://stackoverflow.com/a/57857305
  function removeKey(key: string) {
    context.globalState.update(key, undefined);
  }

  // Removes all keys
  export function resetGlobalState() {
    // Forces the read of the private _value.
    const keys = Object.keys((context.globalState as any)._value);
    keys.forEach(key => removeKey(key));
  }

  export function storeToken(token: string) {
    return context.globalState.update(keys.token, token);
  }

  export function loadToken() {
    return context.globalState.get<string>(keys.token);
  }

  // Or could export removeKey and keys.
  export function removeToken() {
    removeKey(keys.token);
  }
}
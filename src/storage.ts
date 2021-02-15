import vscode from 'vscode';


let context: vscode.ExtensionContext;

// https://stackoverflow.com/a/57857305
function remove(key: string) {
  context.globalState.update(key, undefined);
}

// TODO support for default value
// not using getter/setter/proxy as they may be async.
class Item<T>{
  constructor(private key: string) { }
  get(): T | undefined {
    // for some reason the undefined type isn't being automatically added.
    return context.globalState.get<T>(this.key);
  }
  set(value: T) {
    return context.globalState.update(this.key, value);
  }
  remove() {
    remove(this.key);
  }
}

class StorageClass {
  /**
   * Passes the context, and also removes the current stored token if saveToken configuration is false.
   * For this token behavior, this must be executed before octokit stuff.
   *
   * @export
   * @param {vscode.ExtensionContext} contextArg
   */
  activate(contextArg: vscode.ExtensionContext) {
    context = contextArg;

    // Legacy. Leave it here for some time to remove stored tokens.
    if (this.token.get())
      this.token.remove();
  }

  // Removes all keys
  resetGlobalState() {
    // Forces the read of the private _value.
    const keys = Object.keys((context.globalState as any)._value);
    keys.forEach(key => remove(key));
  }

  token = new Item<string>('token');
}

export const Storage = new StorageClass();
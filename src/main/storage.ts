import vscode from 'vscode';


let context: vscode.ExtensionContext;


// https://stackoverflow.com/a/57857305

function get<T>(key: string): T | undefined;
function get<T>(key: string, defaultValue: T): T;
function get<T>(key: string, defaultValue?: T): T | undefined;
function get<T>(key: string, defaultValue?: T): T | undefined { return context.globalState.get(key, defaultValue); }
function set<T>(key: string, value: T) { return context.globalState.update(key, value); }
function remove(key: string) { return context.globalState.update(key, undefined); }


type ItemCommon = {
  additionalKey: string | string[];
};
class Item<T> {
  constructor(private key: string) { }
  private getKey(additionalKey: string | string[]) {
    const array = [this.key];
    array.push(...(typeof additionalKey === 'string' ? [additionalKey] : additionalKey));
    return array.join('.');
  }
  get<D = T>(args: ItemCommon & {defaultValue: D}): T | D {
    return get(this.getKey(args.additionalKey), args.defaultValue);
  }
  set(args: ItemCommon & {value: T}) {
    return set(this.getKey(args.additionalKey), args.value);
  }
  remove(args: ItemCommon) { return remove(this.getKey(args.additionalKey)); }
}

class StorageClass {
  activate(contextArg: vscode.ExtensionContext) {
    context = contextArg;
  }

  // Call it favorites2 if change its schema
  item = new Item<boolean>('favorites');
  favoritesRepos = {
    _item: new Item<boolean>('favorites'),
    isFavorite(repoName: string): boolean { return this._item.get({ additionalKey: repoName, defaultValue: false }); },
    setFavorite(repoName: string) { return this._item.set({ additionalKey: repoName, value: true }); },
    unsetFavorite(repoName: string) { return this._item.set({ additionalKey: repoName, value: false }); },
  };

  // Removes all keys
  // resetGlobalState() {
  //   // Forces the read of the private _value.
  //   const keys = Object.keys((context.globalState as any)._value);
  //   keys.forEach(key => remove(key));
  // }
}

export const Storage = new StorageClass();
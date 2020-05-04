import vscode from 'vscode';
import { TreeItem, BaseTreeDataProvider } from '../base';
import { user } from '../../User/User';
import { getLoggedTreeData, activateLogged } from './accountLogged';
import { getNotLoggedTreeData, activateNotLogged } from './accountNotLogged';

export let accountTreeDataProvider: TreeDataProvider;

export function activateTreeViewAccount() {
  accountTreeDataProvider = new TreeDataProvider();
  vscode.window.registerTreeDataProvider('githubRepoMgr.views.account', accountTreeDataProvider);
  activateLogged();
  activateNotLogged();
}

// There is a TreeItem from vscode. Should I use it? But it would need a workaround to
// avoid using title in command.
class TreeDataProvider extends BaseTreeDataProvider {

  constructor() { super(); }

  protected makeData() {
    switch (user.status) {

      case user.Status.errorLogging: // TODO: Bad when token already stored and we have a connection error
      case user.Status.notLogged:
        this.data = getNotLoggedTreeData(); break;
      case user.Status.logging:
        this.data = [new TreeItem({
          label: 'Loading...'
        })]; break;
      case user.Status.logged:
        this.data = getLoggedTreeData(); break;
    }
  }

}
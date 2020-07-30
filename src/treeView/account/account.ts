import vscode from 'vscode';
import { TreeItem, BaseTreeDataProvider } from '../base';
import userStore from '../../store';
import { UserStatus } from '../../store/types';
import { getLoggedTreeData, activateLogged } from './accountLogged';
import { getNotLoggedTreeData, activateNotLogged } from './accountNotLogged';

export let accountTreeDataProvider: TreeDataProvider;

export function activateTreeViewAccount() {
  accountTreeDataProvider = new TreeDataProvider();
  vscode.window.registerTreeDataProvider('githubRepoMgr.views.account', accountTreeDataProvider);

  userStore.subscribe(() => { accountTreeDataProvider.refresh(); });
  activateLogged();
  activateNotLogged();
}

// There is a TreeItem from vscode. Should I use it? But it would need a workaround to
// avoid using title in command.
class TreeDataProvider extends BaseTreeDataProvider {

  constructor() { super(); }

  protected makeData() {
    const user = userStore.getState();
    switch (user.status) {
      case UserStatus.errorLogging: // TODO: Bad when token already stored and we have a connection error
      case UserStatus.notLogged:
        this.data = getNotLoggedTreeData(); break;
      case UserStatus.logging:
        this.data = [new TreeItem({
          label: 'Loading...'
        })]; break;
      case UserStatus.logged:
        this.data = getLoggedTreeData(); break;
    }
  }
}
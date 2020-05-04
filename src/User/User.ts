// Used namespace to use it at least once in life and to have Status under user.

import { accountTreeDataProvider } from '../treeView/account/account';
import { window } from 'vscode';
import { getUser } from '../octokit/commands/getUser';


enum Status {
  notLogged, logging, errorLogging, logged
}

export interface UserInterface {
  readonly login: string;
  readonly name: string;
  readonly avatarUri: string;
  readonly profileUri: string;
}

interface User extends UserInterface { }
class User implements UserInterface {
  readonly Status = Status;
  status: Status = Status.errorLogging;

  async loadUser() {
    try {
      user.status = user.Status.logging;
      accountTreeDataProvider.refresh();
      Object.assign(this, await getUser());
      user.status = user.Status.logged;
      accountTreeDataProvider.refresh();
    }
    catch (error) {
      user.status = user.Status.errorLogging;
      window.showErrorMessage(error.message);
      accountTreeDataProvider.refresh();
      throw new Error(error);
    }
  }
}

export const user = new User();
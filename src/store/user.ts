import { Octokit } from '@octokit/rest';
import vscode from 'vscode';
import { getUser } from '../commands/github/getUserData';
import { getLocalReposPathAndUrl } from '../commands/searchClonedRepos/searchClonedRepos';
import { myExtensionSetContext } from '../main/utils';
import { Organization } from './organization';
import type { LocalRepository, Repository } from './repository';


const AUTH_PROVIDER_ID = 'github';
const SCOPES = ['repo', 'read:org'];


// Values are named as we use them to setContext and also for better debugging (console.log(user.state))
export enum UserState {
  /** On extension start */
  init = 'init',
  /** User is not logged */
  notLogged = 'notLogged',
  /** User is logging */
  logging = 'logging',
  /** Error on logging */
  errorLogging = 'errorLogging',
  /** User is logged */
  logged = 'logged',
}

export enum RepositoriesState {
  /** Nothing to be shown. */
  none,
  /** Fetching the repositories list from the server. A "Loading" should be shown. */
  fetching,
  /** Repos may be shown, but we are still fetching some data or doing local steps.
   * // TODO rename this! */
  partial,
  /** There are no informations remaining to be fetched */
  fullyLoaded,
}

// TODO refactor state management. It's quite non intuictive right now. State changing maybe should
// be all in reloadRepos().

class UserClass {
  /** The User current status. */
  readonly state: UserState = UserState.init;
  /** Used by cloneRepo() */
  token: string | undefined;
  /** The user raw name, e.g 'SrBrahma' (not the pretty customizable one). */
  login: string | undefined;
  /** The user GitHub url/uri. */
  profileUri: string | undefined;
  userOrganization: Organization | undefined;
  /** Also includes the user Organization */
  organizations: Organization[] = [];
  /** The User current status. */
  repositoriesState: RepositoriesState = RepositoriesState.none;
  clonedRepos: Repository[] = [];

  /** Returns the orgs that the user can create new repositories.
   * As it uses this.organizations, it includes the user Organization. */
  get organizationUserCanCreateRepositories() { return this.organizations.filter((o) => o.userCanCreateRepositories); }

  /** The ones listening for changes. */
  private subscribers: ['account' | 'repos', () => void][] = [];
  public subscribe(changed: 'account' | 'repos', callback: () => void) { this.subscribers.push([changed, callback]); }
  private informSubscribers(changed: 'account' | 'repos') { this.subscribers.forEach(([c, cb]) => (changed === c) && cb()); }

  /** Will also informSubscribers('account') */
  setUserState(state: UserState) {
    (this.state as any) = state; // as any to override readonly
    void myExtensionSetContext('userState', state);
    this.informSubscribers('account');
  }

  /** Will also informSubscribers('repos') */
  setRepositoriesState(state: RepositoriesState) {
    this.repositoriesState = state;
    this.informSubscribers('repos');
  }


  private resetUser(opts: { resetUserStatus: boolean; resetOctokit: boolean }) {
    this.login = undefined;
    this.profileUri = undefined;
    this.organizations = [];
    if (opts.resetUserStatus)
      this.setUserState(UserState.notLogged);
    if (opts.resetOctokit) {
      octokit = undefined;
      this.token = undefined;
    }
  }

  private resetRepos(opts: { resetRepositoriesStatus: boolean }) {
    this.clonedRepos = [];
    if (opts.resetRepositoriesStatus)
      this.setRepositoriesState(RepositoriesState.none);
  }

  onLogOut() {
    this.resetUser({ resetOctokit: true, resetUserStatus: true });
    this.resetRepos({ resetRepositoriesStatus: true });
  }


  async activate() {
    vscode.commands.registerCommand('githubRepoMgr.commands.auth.vscodeAuth', async () => {
      try {
        /** Returns the new authed token. May throw errors. */
        const token = (await vscode.authentication.getSession(AUTH_PROVIDER_ID, SCOPES, { createIfNone: true }))
          .accessToken;
        await this.initOctokit(token);
      } catch (err: any) {
        void vscode.window.showErrorMessage(err.message);
      }
    });
    try {
      // vscode.authentication.onDidChangeSessions(e => ...); // It doesn't get the logout.
      /** Stored token */
      const token = (await vscode.authentication.getSession(AUTH_PROVIDER_ID, SCOPES, { createIfNone: false }))?.accessToken;
      /** Init octokit if we have a stored token */
      if (token)
        await this.initOctokit(token);
      else
        this.setUserState(UserState.notLogged);
    } catch (err: any) {
      void vscode.window.showErrorMessage(err.message);
    }
  }

  /** Inits octokit and sets token. */
  async initOctokit(token: string): Promise<void> {
    octokit = new Octokit({ auth: token });
    this.token = token;

    /** reloadRepos() will change the userState on its end. */
    await User.reloadRepos().catch ((err) => {
      void vscode.window.showErrorMessage(err.message);
      console.error('Octokit init error: ', err);
      octokit = undefined;
      this.token = undefined;
    });
  }

  private async loadUser(): Promise<void> {
    try {
      this.setUserState(UserState.logging);
      const { login, organizations, profileUri } = await getUser();
      this.login = login;
      this.profileUri = profileUri;
      // We set name as login. The user real name really isn't useful anywhere here and would be too personal, invasive.
      this.userOrganization = new Organization({ login, name: login, isUserOrg: true, userCanCreateRepositories: true });

      this.organizations.push(this.userOrganization);
      this.organizations.push(...organizations.map((org: any) => new Organization({
        isUserOrg: false,
        login: org.login,
        name: org.name,
        userCanCreateRepositories: org.viewerCanCreateRepositories,
      })));
      this.setUserState(UserState.logged);
    } catch (err: any) {
      void vscode.window.showErrorMessage(err.message);
      this.setUserState(UserState.errorLogging);
      throw new Error(err);
    }
  }


  /** Must be executed after loadUser and loadLocalRepos */
  private async loadRepos({ localRepos }: { localRepos: LocalRepository[] }): Promise<void> {

    this.setRepositoriesState(RepositoriesState.fetching);
    await Promise.all(this.organizations.map((org) => org.loadOrgRepos({ localRepos })));

    this.clonedRepos = this.organizations.map((org) => org.clonedRepos).flat();

    let timeout: NodeJS.Timeout | undefined;
    let localReposDirtyCheckedCount = 0;

    const callback = () => {
      localReposDirtyCheckedCount++;
      const checkedAll = localReposDirtyCheckedCount === this.clonedRepos.length;
      if (checkedAll) {
        clearTimeout(timeout as any); // no prob as any here, just to make code shorter.
        this.setRepositoriesState(RepositoriesState.fullyLoaded);
      } else if (!timeout) { timeout = setTimeout(() => { this.informSubscribers('repos'); }, 1000); }
    };

    if (this.clonedRepos.length) {
      this.setRepositoriesState(RepositoriesState.partial); // To show unknown dirtiness or at least the not-cloned repos, if none is cloned.
      this.organizations.forEach((org) => org.checkLocalReposDirtiness(callback));
    } else { this.setRepositoriesState(RepositoriesState.fullyLoaded); }


  }

  /** Fetch again the user data and its orgs that he belongs to. */
  public async reloadRepos(): Promise<void> {
    if ([RepositoriesState.none, RepositoriesState.fullyLoaded].includes(this.repositoriesState)) {
      this.resetUser({ resetUserStatus: false, resetOctokit: false });
      this.resetRepos({ resetRepositoriesStatus: false });
      if (!octokit) // Ignore if octokit not set up, after resetting above.
        return;
      this.setRepositoriesState(RepositoriesState.fetching);
      const [, localRepos] = await Promise.all([this.loadUser(), getLocalReposPathAndUrl()]);
      await this.loadRepos({ localRepos });
    }
  }

}

export const User = new UserClass();
export let octokit: Octokit | undefined = undefined;
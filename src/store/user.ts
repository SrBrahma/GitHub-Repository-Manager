import { Octokit } from '@octokit/rest';
import gitUrlParse from 'git-url-parse';
import vscode, { authentication, window } from 'vscode';
import { getDirtiness } from '../commands/git/dirtiness';
import type { DirWithGitUrl } from '../commands/git/searchClonedRepos';
import { getLocalReposPathAndUrl } from '../commands/git/searchClonedRepos';
import { getUserData } from '../commands/github/getUserData';
import { myExtensionSetContext } from '../main/utils';
import { Organization } from './organization';
import type { Repository } from './repository';
import { isRepoOnDisk } from './repository';

const AUTH_PROVIDER_ID = 'github';
const SCOPES = ['repo', 'read:org'];

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
  /** Repos may be shown, but we are still fetching some data or doing local steps. */
  checkingDirtiness,
  /** Everything fetched and done */
  fullyLoaded,
}

// TODO refactor state management. It's quite non intuictive right now. State changing maybe should
// be all in reloadRepos().

class UserClass {
  /**
   * The User current status.
   * Readonly so we don't change it by accident. Use setUserState().
   */
  readonly state: UserState = UserState.init;
  /** Used by cloneRepo() */
  token: string | undefined;
  /** The user raw name, e.g 'SrBrahma' (not the pretty customizable one). */
  login: string | undefined;
  /** The user GitHub url/uri. */
  profileUri: string | undefined;
  /** Also includes the user Organization */
  organizations: Organization[] = [];
  /** The User current status. */
  repositoriesState: RepositoriesState = RepositoriesState.none;
  clonedRepos: Repository<true, 'user-is-member'>[] = [];
  /** Repositories that are cloned but not from user / user's org */
  otherLocalsRepos: Repository<true>[] = [];

  /** The ones listening for changes. */
  private subscribers: ['account' | 'repos', () => void][] = [];
  public subscribe(changed: 'account' | 'repos', callback: () => void) {
    this.subscribers.push([changed, callback]);
  }

  private informSubscribers(changed: 'account' | 'repos') {
    this.subscribers.forEach(([c, cb]) => changed === c && cb());
  }

  /** Will also informSubscribers('account') */
  setUserState(state: UserState) {
    (this.state as any) = state; // as any to override readonly
    // To be used by package.json when clauses etc
    void myExtensionSetContext('userState', state);
    this.informSubscribers('account');
  }

  /** Will also informSubscribers('repos') */
  setRepositoriesState(state: RepositoriesState) {
    this.repositoriesState = state;
    this.informSubscribers('repos');
  }

  private reset({ repositoriesState }: { repositoriesState: RepositoriesState }) {
    this.login = undefined;
    this.profileUri = undefined;
    this.organizations = [];
    this.clonedRepos = [];
    this.otherLocalsRepos = [];
    this.setRepositoriesState(repositoriesState);
  }

  private async loadLocalToken() {
    try {
      /** Stored token */
      const token = (
        await authentication.getSession(AUTH_PROVIDER_ID, SCOPES, {
          createIfNone: false,
        })
      )?.accessToken;
      /** Init octokit if we have a stored token */
      if (token) await this.initOctokit(token);
      else this.setUserState(UserState.notLogged);
    } catch (err: any) {
      void window.showErrorMessage(err.message);
    }
  }

  public activate() {
    vscode.commands.registerCommand(
      'githubRepoMgr.commands.auth.vscodeAuth',
      async () => {
        try {
          /** Returns the new authed token. May throw errors. */
          const token = (
            await authentication.getSession(AUTH_PROVIDER_ID, SCOPES, {
              createIfNone: true,
            })
          ).accessToken;
          await this.initOctokit(token);
        } catch (err: any) {
          void window.showErrorMessage(err.message);
        }
      },
    );
    void this.loadLocalToken();
  }

  /** Inits octokit and sets token. */
  public async initOctokit(token: string): Promise<void> {
    octokit = new Octokit({ auth: token });
    this.token = token;

    /** reloadRepos() will change the userState on its end. */
    await this.reloadRepos().catch((err) => {
      void window.showErrorMessage(err.message);
      octokit = undefined;
      this.token = undefined;
    });
  }

  private async loadUser({ octokit }: { octokit: Octokit }): Promise<void> {
    try {
      this.setUserState(UserState.logging);
      const { login, organizations, profileUri } = await getUserData({ octokit });
      this.login = login;
      this.profileUri = profileUri;

      this.organizations = [
        new Organization({
          login,
          name: login, // Using the user real name could feel too invasive.
          isUserOrg: true,
          userCanCreateRepositories: true,
        }),
        ...organizations.map(
          (org) =>
            new Organization({
              isUserOrg: false,
              login: org.login,
              name: org.name,
              userCanCreateRepositories: org.viewerCanCreateRepositories,
            }),
        ),
      ];
      this.setUserState(UserState.logged);
    } catch (err: any) {
      void window.showErrorMessage(err.message);
      this.setUserState(UserState.errorLogging);
      throw new Error(err);
    }
  }

  /** Must be executed after loadUser and loadLocalRepos */
  private async loadRepositories({
    localRepos,
    octokit,
  }: {
    localRepos: DirWithGitUrl[];
    octokit: Octokit;
  }): Promise<void> {
    this.setRepositoriesState(RepositoriesState.fetching);
    await Promise.all(
      this.organizations.map((org) => org.loadOrgRepos({ localRepos, octokit })),
    );

    // Get dirtyness status of local repos
    this.clonedRepos = this.organizations.map((org) => org.clonedRepos).flat();
    this.otherLocalsRepos = localRepos
      // Remove repos that are on Cloned tree
      .filter(
        (r) =>
          !this.clonedRepos.find((c) => isRepoOnDisk(c) && c.localPath === r.dirPath),
      )
      .map((r) => ({
        name: gitUrlParse(r.gitUrl).name,
        ownerLogin: gitUrlParse(r.gitUrl).owner,
        url: r.gitUrl,
        localPath: r.dirPath,
        type: 'local',
        dirty: 'unknown',
      }));

    // To show unknown dirtiness or at least the not-cloned repos, if none is cloned.
    this.setRepositoriesState(RepositoriesState.checkingDirtiness);

    // Updates dirty forms from time to time while not done
    const interval = setInterval(() => {
      this.informSubscribers('repos');
    }, 250);

    try {
      // Check dirty of orgs' local repos
      await Promise.all(
        this.organizations.map((org) =>
          Promise.all(
            org.clonedRepos.map(async (localRepo) => {
              localRepo.dirty = await getDirtiness(localRepo.localPath);
            }),
          ),
        ),
      );
    } finally {
      clearInterval(interval);
    }

    this.setRepositoriesState(RepositoriesState.fullyLoaded);
  }

  /** Fetch again the user data and its orgs that he belongs to. */
  // TODO add local reload, for actions like delete to avoid unncessary refetch
  public async reloadRepos(): Promise<void> {
    if (!octokit) throw new Error('Octokit not set up!');

    // Don't allow multiple fetches (it should, by cancelling first)
    if (this.repositoriesState === RepositoriesState.fetching) return;

    this.reset({ repositoriesState: RepositoriesState.fetching });

    const [localRepos] = await Promise.all([
      getLocalReposPathAndUrl(),
      this.loadUser({ octokit }),
    ]);
    await this.loadRepositories({ localRepos, octokit });
  }
}

export const User = new UserClass();
export let octokit: Octokit | undefined = undefined;

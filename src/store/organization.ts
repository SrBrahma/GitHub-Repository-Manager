import { getOrgRepos } from '../commands/github/getOrgRepos';
import { getUserRepos } from '../commands/github/getUserRepos';
import { getDirtiness } from '../commands/git/dirtiness/dirtiness';
import { LocalRepository, Repository } from './repository';

export enum OrgStatus {
  notLoaded,
  loading,
  errorLoading,
  loaded,
}

type OrganizationConstructor = {
  /** Organization raw name, e.g 'srbrahmaTest' */
  login: string;
  /** Organization pretty name, e.g 'SrBrahma Test' */
  name: string;
  isUserOrg: boolean;
};

export class Organization {
  name: string; // Used in notClonedRepo tree.
  login: string;
  status: OrgStatus;
  repositories: Repository[] = [];
  clonedRepos: Repository[] = [];
  notClonedRepos: Repository[] = [];
  /** If it is the user organization, = the repos belong to him. */
  isUserOrg: boolean;

  constructor(args: OrganizationConstructor) {
    this.login = args.login;
    this.name = args.name;
    this.isUserOrg = args.isUserOrg;
    this.status = OrgStatus.notLoaded;
  }

  /** Callback is called for every local repo dirtiness checked. */
  async checkLocalReposDirtiness(callback: () => void): Promise<void> {
    await Promise.all(this.clonedRepos.map(async localRepo => {
      localRepo.dirty = await getDirtiness(localRepo.localPath!);
      callback();
    }));
  }

  /** Call it after constructing it. */
  async loadOrgRepos({ localRepos }: {
    localRepos: LocalRepository[];
  }): Promise<void> {
    try {
      this.status = OrgStatus.loading;

      this.repositories = this.isUserOrg ? await getUserRepos() : await getOrgRepos(this.login);
      // TODO splice localRepos so other orgs won't loop over it? Good for users/orgs with hundreds/thousands of repos.
      localRepos.forEach(localRepo => {
        const repoMatch = this.repositories.find(repo => repo.url === localRepo.gitUrl);
        if (repoMatch) {
          repoMatch.localPath = localRepo.dirPath;
          repoMatch.dirty = 'unknown';
        }
      });
      this.clonedRepos = this.repositories.filter(repo => repo.localPath);
      this.notClonedRepos = this.repositories.filter(repo => !repo.localPath);

      this.status = OrgStatus.loaded;
    } catch (err) {
      this.status = OrgStatus.errorLoading;
      throw new Error(err);
    }
  }
}

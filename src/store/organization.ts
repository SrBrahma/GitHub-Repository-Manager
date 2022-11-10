import { getOrgRepos } from '../commands/github/getOrgRepos';
import { getUserRepos } from '../commands/github/getUserRepos';
import type { DirWithGitUrl } from '../commands/searchClonedRepos/searchClonedRepos';
import type { Repository } from './repository';
import { isRepoOnDisk } from './repository';

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
  userCanCreateRepositories: boolean;
};

export class Organization {
  name: string; // Used in notClonedRepo tree.
  login: string;
  status: OrgStatus;
  repositories: Repository<boolean, 'user-is-member'>[] = [];
  clonedRepos: Repository<true, 'user-is-member'>[] = [];
  notClonedRepos: Repository<false, 'user-is-member'>[] = [];
  /** If it is the user organization, = the repos belong to him. */
  isUserOrg: boolean;
  /** If the user can create new repositories in this organization */
  userCanCreateRepositories: boolean;

  constructor(args: OrganizationConstructor) {
    this.login = args.login;
    this.name = args.name;
    this.isUserOrg = args.isUserOrg;
    this.userCanCreateRepositories = args.userCanCreateRepositories;
    this.status = OrgStatus.notLoaded;
  }

  /** Call it after constructing it. */
  async loadOrgRepos({ localRepos }: { localRepos: DirWithGitUrl[] }): Promise<void> {
    try {
      this.status = OrgStatus.loading;

      this.repositories = this.isUserOrg
        ? await getUserRepos()
        : await getOrgRepos(this.login);
      // TODO splice localRepos so other orgs won't loop over it? Good for users/orgs with hundreds/thousands of repos.
      localRepos.forEach((localRepo) => {
        const repoMatch = this.repositories.find(
          (repo) => repo.url === localRepo.gitUrl,
        ) as Repository<true, 'user-is-member'> | undefined;
        if (repoMatch) {
          repoMatch.localPath = localRepo.dirPath;
          repoMatch.dirty = 'unknown';
        }
      });
      this.clonedRepos = this.repositories.filter((repo) =>
        isRepoOnDisk(repo),
      ) as Repository<true, 'user-is-member'>[];
      this.notClonedRepos = this.repositories.filter(
        (repo) => !isRepoOnDisk(repo),
      ) as Repository<false, 'user-is-member'>[];

      this.status = OrgStatus.loaded;
    } catch (err: any) {
      this.status = OrgStatus.errorLoading;
      throw new Error(err);
    }
  }
}

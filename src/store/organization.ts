import type { Octokit } from '@octokit/rest';
import type { DirWithGitUrl } from '../commands/git/searchClonedRepos';
import { getOrgRepos } from '../commands/github/getOrgRepos';
import { getUserRepos } from '../commands/github/getUserRepos';
import type { Repository } from './repository';
import { isRepoNotOnDisk, isRepoOnDisk } from './repository';

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
  name: string; // Pretty name
  login: string; // Raw name
  /** If it is the user organization, = the repos belong to him. */
  isUserOrg: boolean;
  clonedRepos: Repository<true, 'user-is-member'>[] = [];
  notClonedRepos: Repository<false, 'user-is-member'>[] = [];
  /** If the user can create new repositories in this organization */
  userCanCreateRepositories: boolean;

  constructor(args: OrganizationConstructor) {
    this.login = args.login;
    this.name = args.name;
    this.isUserOrg = args.isUserOrg;
    this.userCanCreateRepositories = args.userCanCreateRepositories;
  }

  /** Call it after constructing it. */
  async loadOrgRepos({
    localRepos,
    octokit,
  }: {
    localRepos: DirWithGitUrl[];
    octokit: Octokit;
  }): Promise<void> {
    const repositories = this.isUserOrg
      ? await getUserRepos({ octokit })
      : await getOrgRepos({ login: this.login, octokit });

    // Discover repos that are on disk
    localRepos.forEach((localRepo) => {
      const repositoryOnDisk = repositories.find(
        (repo) => repo.url === localRepo.gitUrl,
      ) as Repository<true, 'user-is-member'> | undefined;
      if (repositoryOnDisk) {
        repositoryOnDisk.localPath = localRepo.dirPath;
        repositoryOnDisk.dirty = 'unknown';
      }
    });

    this.clonedRepos = repositories.filter(isRepoOnDisk);
    this.notClonedRepos = repositories.filter(isRepoNotOnDisk);
  }
}

import { searchLocalReposAndSetRepoPath, SearchClonedReposStatus } from "./searchClonedRepos";
import { repositoriesTreeDataProvider } from "../treeView/repositories/repositories";
import { window } from "vscode";
import { getRepos } from '../octokit/commands/getRepos';

interface RepositoryInterface {
  name: string,
  description: string,
  ownerLogin: string,
  languageName?: string,  // "C++" etc
  url: string,

  isPrivate: boolean,
  isTemplate: boolean,
  isFork: boolean,

  userIsAdmin: boolean,

  parentRepoName?: string,
  parentRepoOwnerLogin?: string,

  createdAt: Date,
  updatedAt: Date,
}

//https://github.com/microsoft/TypeScript/issues/5326#issuecomment-592058988
export interface Repository extends RepositoryInterface { }
export class Repository {
  localPath: string | null = null;
  constructor(props: RepositoryInterface) {
    Object.assign(this, props);
  }
}


export class Repositories {
  private repositories: Repository[] = [];
  get repos() { return this.repositories; } // Shorter form, also, external readonly.

  SearchLocalReposStatus = SearchClonedReposStatus;

  searchLocalReposStatus = SearchClonedReposStatus.ok;

  /**
  * You probably don't want to await this function, as it will run findLocalRepos...()
  */
  async loadRepos() {
    try {
      this.repositories = await getRepos();
      this.findLocalRepos();
    }
    catch (err) {
      window.showErrorMessage(err.message);
      throw new Error(err);
    }
  }

  clearRepositories() {
    this.repositories = [];
  }

  async findLocalRepos() {
    this.searchLocalReposStatus = SearchClonedReposStatus.searching;
    repositoriesTreeDataProvider.refresh();

    this.searchLocalReposStatus = await searchLocalReposAndSetRepoPath(this.repositories);
    repositoriesTreeDataProvider.refresh();
  }
}

export const repositories = new Repositories();
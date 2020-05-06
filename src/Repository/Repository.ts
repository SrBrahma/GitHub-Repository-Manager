import { searchLocalReposAndSetRepoPath, SearchClonedReposStatus } from "./searchClonedRepos";
import { repositoriesTreeDataProvider } from "../treeView/repositories/repositories";
import { window } from "vscode";
import { getRepos } from '../octokit/commands/getRepos';

interface RepositoryInterface {
  isPrivate: boolean;
  isFork: boolean,
  userIsAdmin: boolean,
  name: string,
  ownerLogin: string,
  description: string,
  language: string,  // "C++" etc
  htmlUrl: string;
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
    catch (error) {
      window.showErrorMessage(error.message);
      throw new Error(error);
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
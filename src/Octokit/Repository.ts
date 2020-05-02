interface RepositoryInterface {
  name: string,
  ownerLogin: string,
  description: string,
  language: string;  // "C++" etc
}

//https://github.com/microsoft/TypeScript/issues/5326#issuecomment-592058988
export interface Repository extends RepositoryInterface { }
export class Repository {
  constructor(props: RepositoryInterface) {
    Object.assign(this, props);
  }
}


export let repositories: Repository[] = [];
export function setRepositories(reposArg: Repository[]) { repositories = reposArg; }
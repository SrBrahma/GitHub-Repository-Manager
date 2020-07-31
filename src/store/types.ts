export enum UserStatus {
    notLogged, logging, errorLogging, logged
}

export interface User {
    login: string;
    profileUri: string;
    organizations: Org[];
    status?: UserStatus;
    // Master list of all local repos kept here so we dont have to look it up on every fetch
    localRepos?: LocalRepository[]
}

export enum OrgStatus {
    notLoaded = "Not Loaded",
    loading = "Loading...",
    loaded = "Loaded"
}

export interface Org {
    id: string;
    name: string;
    login: string;
    status: OrgStatus;
    repositories: Repository[]
}

export interface Repository {
    name: string,
    description: string | null,
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
    localPath?: string;
}

export interface LocalRepository {
    dirPath: string,
    gitUrl: string,
}
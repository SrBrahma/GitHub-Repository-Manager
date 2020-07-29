export enum UserStatus {
    notLogged, logging, errorLogging, logged
}

export interface UserInterface {
    login: string;
    profileUri: string;
    organizations: OrgInterface[];
    status?: UserStatus;
}

export enum OrgStatus {
    notLoaded = "Not Loaded",
    loading = "Loading...",
    loaded = "Loaded"
}

export interface OrgInterface {
    id: string;
    name: string;
    login: string;
    status: OrgStatus;
    repositories: RepositoryInterface[]
}

export interface RepositoryInterface {
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

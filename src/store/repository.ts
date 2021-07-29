import { IsGitDirty as Dirty } from '../commands/git/isGitDirty/isGitDirty';


export type Repository = {
  name: string;
  description: string | null;
  ownerLogin: string;
  languageName?: string; // "C++" etc
  /** GitHub project url. */
  url: string;
  /** GitHub project url, with .git on end. */
  // gitUrl: string;

  isPrivate: boolean;
  isTemplate: boolean;
  isFork: boolean;

  userIsAdmin: boolean;

  parentRepoName?: string;
  parentRepoOwnerLogin?: string;

  createdAt: Date;
  updatedAt: Date;

  localPath?: string;
  dirty?: Dirty;
  isFavorited?: boolean;
};

export type LocalRepository = {
  dirPath: string;
  gitUrl: string;
};
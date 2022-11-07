import type { Dirtiness } from '../commands/git/dirtiness/dirtiness';


/** TODO rename */
export type LocalRepository = {
  type: 'local';
  name: string;
  ownerLogin: string;
  /** GitHub project url. */
  url: string;
  localPath?: string;
  dirty?: Dirtiness;
};

export type RemoteRepository = Omit<LocalRepository, 'type'> & {
  type: 'remote';
  description: string | null;
  languageName?: string; // "C++" etc

  isPrivate: boolean;
  isTemplate: boolean;
  isFork: boolean;

  parentRepoName?: string;
  parentRepoOwnerLogin?: string;

  createdAt: Date;
  updatedAt: Date;

  isFavorited?: boolean;
};


export type Repository = LocalRepository | RemoteRepository;

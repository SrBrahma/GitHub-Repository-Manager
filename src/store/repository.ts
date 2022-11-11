/* eslint-disable @typescript-eslint/ban-types */
import type { Dirtiness } from '../commands/git/dirtiness';

export type Remote = 'no-remote' | 'user-is-member' | 'user-not-member';

type Base = {
  name: string;
};
type OnDisk = {
  localPath: string;
  dirty: Dirtiness;
};

type WithRemote = {
  /** GitHub project url. */
  url: string;
  ownerLogin: string;
};

type UserIsMember = {
  description: string | null;
  languageName?: string; // "C++" etc

  isPrivate: boolean;
  isTemplate: boolean;
  isFork: boolean;

  parentRepoName?: string;
  parentRepoOwnerLogin?: string;

  createdAt: Date;
  updatedAt: Date;
};

export type Repository<
  D extends boolean = boolean,
  R extends Remote = Remote,
> = Base &
  (D extends false ? {} : OnDisk) &
  (R extends 'no-remote'
    ? {}
    : WithRemote & (R extends 'user-not-member' ? {} : UserIsMember));

export function isRepoOnDisk<R extends Remote>(
  repo: Repository<boolean, R>,
): repo is Repository<true, R> {
  return 'localPath' in repo;
}

export function isRepoNotOnDisk<R extends Remote>(
  repo: Repository<boolean, R>,
): repo is Repository<false, R> {
  return !('localPath' in repo);
}

export function hasRepoRemote<D extends boolean>(
  repo: Repository<D, Remote>,
): repo is Repository<D, 'user-is-member' | 'user-not-member'> {
  return 'url' in repo;
}

export function hasRepoRemoteWithUserAccess<D extends boolean>(
  repo: Repository<D, Remote>,
): repo is Repository<D, 'user-is-member'> {
  return 'isPrivate' in repo;
}

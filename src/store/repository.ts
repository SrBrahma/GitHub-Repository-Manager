/* eslint-disable @typescript-eslint/ban-types */
import type { Dirtiness } from '../commands/git/dirtiness/dirtiness';


export type Remote = 'no-remote' | 'user-is-member' | 'user-not-member';
export type Repository<OnDisk extends boolean = boolean, R extends Remote = Remote> = {
  name: string;
} & (OnDisk extends false ? {} : {
  localPath: string;
  dirty: Dirtiness;
}) & (
  (R extends 'no-remote' ? {} : {
    /** GitHub project url. */
    url: string;
    ownerLogin: string;
  }) &
  (R extends 'user-not-member' ? {} : {
    description: string | null;
    languageName?: string; // "C++" etc

    isPrivate: boolean;
    isTemplate: boolean;
    isFork: boolean;

    parentRepoName?: string;
    parentRepoOwnerLogin?: string;

    createdAt: Date;
    updatedAt: Date;
  })
);

export function isRepoOnDisk<R extends Remote>(repo: Repository<true, R> | Repository<false, R>): repo is Repository<true, R> {
  return ('localPath' in repo);
}

export function hasRepoRemoteWithUserAccess<D extends boolean>(repo: Repository<D, Remote>): repo is Repository<D, 'user-is-member'> {
  return ('isPrivate' in repo);
}

export function hasRepoRemote<D extends boolean>(repo: Repository<D, Remote>): repo is Repository<D, 'user-is-member' | 'user-not-member'> {
  return ('url' in repo);
}
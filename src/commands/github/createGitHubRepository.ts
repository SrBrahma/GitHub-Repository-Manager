import type { Octokit } from '@octokit/rest';
import { octokit } from '../../store/user';



type Fun = Octokit['repos']['createForAuthenticatedUser'];
type ThenArg<T> = T extends PromiseLike<infer U> ? U : T;
export type CreateGitHubRepositoryReturn = ThenArg<ReturnType<Fun>>['data'];

type Options = {
  /** Repository name */
  name: string;
  /** The organization to create the repository.
   *
   * If undefined, will create the repo for the user. */
  organizationLogin?: string;
  /** Repository description */
  description?: string;
  /** If will be private or public.
   * @default private */
  isPrivate: boolean;
};

// https://octokit.github.io/rest.js/v17#repos-create-for-authenticated-user
// TODO: Create new repo with README.md and other optional stuff (user config.)

/** @returns the data result of the octokit function. */
export async function createGitHubRepository(
  { name, description, isPrivate, organizationLogin }: Options,
): Promise<CreateGitHubRepositoryReturn> {
  if (!octokit)
    throw new Error('Octokit not set up!');

  if (organizationLogin)
    return (await octokit.repos.createInOrg({
      name,
      org: organizationLogin,
      description,
      private: isPrivate, // Can't use 'private' in param destructuring
    })).data;

  else
    return (await octokit.repos.createForAuthenticatedUser({
      name,
      description,
      private: isPrivate,
    })).data;

}
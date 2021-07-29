import { Octokit } from '@octokit/rest';
import { octokit } from '../../store/user';

type Options = {
  /** Repository name */
  name: string;
  /** Repository description */
  description?: string;
  /** If will be private or public.
   * @default private */
  isPrivate: boolean;
};


type Fun = Octokit['repos']['createForAuthenticatedUser'];
type ThenArg<T> = T extends PromiseLike<infer U> ? U : T;
type Data = ThenArg<ReturnType<Fun>>['data'];

// https://octokit.github.io/rest.js/v17#repos-create-for-authenticated-user
// TODO: Create new repo with README.md and other optional stuff (user config.)

/** @returns the data result of the octokit function. */
export async function createGitHubRepository({ name, description, isPrivate }: Options): Promise<Data> {
  if (!octokit)
    throw new Error('Octokit not set up!');

  const { data } = await octokit.repos.createForAuthenticatedUser({
    name,
    description,
    private: isPrivate, // Can't use 'private' in param destructuring
  });

  return data;
}
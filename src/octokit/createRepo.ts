import { Repository } from '../store/repository';
import { octokit } from '../store/user';
import { extractRepositoryFromData } from './getOrgRepos';

type CreateArgs = {
  name: string;
  description?: string;
  isPrivate?: boolean; // Defaults to false. Couldn't name it as private, as it is a keyword.
};

// a) Create Empty GitHub Repository
// b) Create GitHub Repository with current project
// (if there is a .git on curr project, should we add remote to the new github repo?)
// https://octokit.github.io/rest.js/v17#repos-create-for-authenticated-user
// Returns the new repository
// TODO: Create new repo with README.md and other optional stuff (user config.)
export async function create({ name, description, isPrivate }: CreateArgs): Promise<Repository> {
  if (!octokit)
    throw new Error('Octokit not set up!');
  const { data } = await octokit.repos.createForAuthenticatedUser({
    name,
    description,
    private: isPrivate, // Can't use 'private' in param destructuring
  });
  return extractRepositoryFromData(data);
}
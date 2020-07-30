import { octokit } from '../octokit';
import { extractRepositoryFromData } from './getRepos';
import { RepositoryInterface } from '../../store/types';

interface CreateInterface {
  name: string;
  description?: string;
  privateRepo?: boolean; // Defaults to false. Couldn't name it as private, as it is a keyword.
}
// a) Create Empty GitHub Repository
// b) Create GitHub Repository with current project
// (if there is a .git on curr project, should we add remote to the new github repo?)
// https://octokit.github.io/rest.js/v17#repos-create-for-authenticated-user
// Returns the new repository
// TODO: Create new repo with README.md and other optional stuff (user config.)
export async function create({ name, description, privateRepo }: CreateInterface): Promise<RepositoryInterface> {
  try {
    const { data } = await octokit.repos.createForAuthenticatedUser({
      name,
      description,
      private: privateRepo // Can't use 'private' in param destructuring
    });
    return extractRepositoryFromData(data);
  }
  catch (err) {
    throw new Error(err);
  }
}
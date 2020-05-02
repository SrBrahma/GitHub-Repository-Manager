import { octokit } from '../octokit';

interface CreateInterface {
  name: string;
  description?: string;
  privateRepo?: boolean; // Defaults to false. Couldn't name it as private, as it is a keyword.
}
// a) Create Empty GitHub Repository
// b) Create GitHub Repository with current project
// (if there is a .git on curr project, should we add remote to the new github repo?)
// https://octokit.github.io/rest.js/v17#repos-create-for-authenticated-user
export async function create({ name, description, privateRepo }: CreateInterface) {
  const { status, data } = await octokit.repos.createForAuthenticatedUser({
    name,
    description,
    private: privateRepo // Can't use 'private' in param destructuring
  });
  console.log(status, data);
}
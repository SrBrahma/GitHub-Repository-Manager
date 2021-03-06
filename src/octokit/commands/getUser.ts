import { getOctokitErrorMessage } from './utils';
import { octokit } from '../octokit';
import { User } from '../../store/types';

export async function getUser(): Promise<User> {
  try {
    const userData = (await octokit.graphql(
      `query getUser ($after: String) {
        viewer {
          login
          url
          organizations(first: 100, after: $after) {
            edges {
              node {
                id,
                login,
                name
              }
            }
          }
        }
      }`) as any).viewer;

    return {
      login: userData.login,
      profileUri: userData.url,
      organizations: userData.organizations.edges.map((org: any) => org.node)
    };
  }
  // Octokit has a pattern for errors, which we display properly at octokitErrorDisplay().
  catch (err) {
    // Handle insufficient scope by logging user out
    if (err.errors?.find((error: any) => error.type === 'INSUFFICIENT_SCOPES')) {
      console.error(err);
      throw new Error('Insufficient access permitions! Just re-OAuth again, or if using Personal Access Token, have "repo" and "read:org" (new!) permissions checked!');
    }

    throw new Error(getOctokitErrorMessage(err));
  }
}
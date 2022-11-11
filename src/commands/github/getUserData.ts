// GitHub GraphQL API Explorer: https://docs.github.com/en/graphql/overview/explorer

import type { Octokit } from '@octokit/rest';
import { getOctokitErrorMessage } from './queryUtils';

type GetUser = {
  login: string;
  profileUri: string;
  organizations: {
    login: string;
    name: string;
    viewerCanCreateRepositories: boolean;
  }[];
};

export async function getUserData({
  octokit,
}: {
  octokit: Octokit;
}): Promise<GetUser> {
  try {
    const userData = (
      (await octokit.graphql(
        // Doesn't seem to be possible to orderBy name as getRepo does. But it prob should be done automatically.
        `query getUserQuery ($after: String) {
        viewer {
          login
          url
          organizations(first: 100, after: $after) {
            edges {
              node {
                login
                name
                viewerCanCreateRepositories
              }
            }
          }
        }
      }`,
      )) as any
    ).viewer;

    return {
      login: userData.login,
      profileUri: userData.url,
      organizations: userData.organizations.edges.map((org: any) => org.node),
    };
  } catch (err: any) {
    // Octokit has a pattern for errors, which we display properly at octokitErrorDisplay().
    // Handle insufficient scope by logging user out
    if (err.errors?.find((error: any) => error.type === 'INSUFFICIENT_SCOPES')) {
      console.error(err);
      throw new Error(
        'Insufficient access permitions! Just re-OAuth again, or if using Personal Access Token, have "repo" and "read:org" (new!) permissions checked!',
      );
    }

    throw new Error(getOctokitErrorMessage(err));
  }
}

import { Repository } from '../../store/repository';
import { octokit } from '../../store/user';
import { getOctokitErrorMessage } from './getOctokitErrorMessage';

export function extractRepositoryFromData(data: any): Repository {
  return {
    name: data.name,
    description: data.description,
    ownerLogin: data.owner.login,
    languageName: data.primaryLanguage?.name,
    url: data.url,

    // gitUrl: data.,

    isPrivate: data.isPrivate,
    isFork: data.isFork,
    isTemplate: data.isTemplate,

    // parent may be null if isn't a fork.
    parentRepoName: data.parent?.name,
    parentRepoOwnerLogin: data.parent?.owner.login,

    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
}

/** Used for both orgRepos and userRepos.
 *
 * The different indendation from query doesn't matter. https://stackoverflow.com/q/62398415/10247962 */
export const repoInfosQuery = `
name
description
owner {
  login
}
primaryLanguage {
  name
}
url
isPrivate
isFork
isTemplate
parent {
  name
  owner {
    login
  }
}
createdAt
updatedAt
`;

export async function getOrgRepos(login: string): Promise<Repository[]> {
  if (!octokit)
    throw new Error('Octokit not set up!');
  try {
    const repos: Repository[] = [];

    let endCursor: string | null = null;
    let hasNextPage = false;

    do {
      // https://github.com/octokit/graphql.js/#variables
      const response = (await octokit.graphql(query, {
        after: endCursor,
        org: login,
      }) as any);

      if (response.viewer.organization === null)
        return repos;

      const { nodes, pageInfo } = response.viewer.organization.repositories;
      ({ endCursor, hasNextPage } = pageInfo);
      repos.push(...nodes.map((node: any) => extractRepositoryFromData(node)));
    } while (hasNextPage);

    return repos;
  } catch (err) { // Octokit has a patter for errors, which we display properly at octokitErrorDisplay().
    throw new Error(getOctokitErrorMessage(err));
  }
}



const query = `
query getOrgRepos ($after: String, $org: String!) {
  viewer {
    organization(login: $org) {
      repositories(isFork: false, first: 100, after: $after) {
        pageInfo {
          endCursor
          hasNextPage
        }
        nodes {
          ${repoInfosQuery}
        }
      }
    }
  }
}`;
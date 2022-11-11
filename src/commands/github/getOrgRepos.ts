// GitHub GraphQL API Explorer: https://docs.github.com/en/graphql/overview/explorer

import type { Octokit } from '@octokit/rest';
import type { Repository } from '../../store/repository';
import {
  extractRepositoryFromData,
  getOctokitErrorMessage,
  repoInfosQuery,
} from './queryUtils';

export async function getOrgRepos({
  login,
  octokit,
}: {
  login: string;
  octokit: Octokit;
}): Promise<Repository<false, 'user-is-member'>[]> {
  try {
    const repos: Repository<false, 'user-is-member'>[] = [];

    let endCursor: string | null = null;
    let hasNextPage = false;

    do {
      // https://github.com/octokit/graphql.js/#variables
      const response = (await octokit.graphql(query, {
        after: endCursor,
        org: login,
      })) as any;

      if (response.viewer.organization === null) return repos;

      const { nodes, pageInfo } = response.viewer.organization.repositories;
      ({ endCursor, hasNextPage } = pageInfo);
      repos.push(...nodes.map((node: any) => extractRepositoryFromData(node)));
    } while (hasNextPage);

    return repos;
  } catch (err: any) {
    // Octokit has a patter for errors, which we display properly at octokitErrorDisplay().
    throw new Error(getOctokitErrorMessage(err));
  }
}

const query = `
query getOrgReposQuery ($after: String, $org: String!) {
  viewer {
    organization(login: $org) {
      repositories(
        isFork: false, first: 100, after: $after
        orderBy: { field: NAME, direction: ASC }
      ) {
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

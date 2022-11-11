// GitHub GraphQL API Explorer: https://docs.github.com/en/graphql/overview/explorer

import type { Octokit } from '@octokit/rest';
import type { Repository } from '../../store/repository';
import {
  extractRepositoryFromData,
  getOctokitErrorMessage,
  repoInfosQuery,
} from './queryUtils';

export async function getUserRepos({
  octokit,
}: {
  octokit: Octokit;
}): Promise<Repository<false, 'user-is-member'>[]> {
  try {
    const repos: Repository<false, 'user-is-member'>[] = [];
    // For pagination (if user has more repos than the query results (current max per query is 100))
    let endCursor: string | null = null;
    let hasNextPage = false;

    do {
      // https://github.com/octokit/graphql.js/#variables
      const { nodes, pageInfo }: { nodes: any; pageInfo: any } = (
        (await octokit.graphql(query, {
          after: endCursor,
        })) as any
      ).viewer.repositories;

      ({ endCursor, hasNextPage } = pageInfo);

      repos.push(...nodes.map((node: any) => extractRepositoryFromData(node)));
    } while (hasNextPage);

    return repos;
  } catch (err: any) {
    // Octokit has a patter for errors, which we display properly at octokitErrorDisplay().
    throw new Error(getOctokitErrorMessage(err));
  }
}

// Made with https://developer.github.com/v4/explorer/
const query = `
query getReposQuery ($after: String) {
  viewer {
    repositories(
      first: 100, after: $after
      affiliations: [OWNER], ownerAffiliations:[OWNER],
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
}`;

// GitHub GraphQL API Explorer: https://docs.github.com/en/graphql/overview/explorer

import type { Repository } from '../../store/repository';
import { octokit } from '../../store/user';
import { getOctokitErrorMessage } from './getOctokitErrorMessage';
import { extractRepositoryFromData, repoInfosQuery } from './getOrgRepos';

export async function getUserRepos(): Promise<Repository<false, 'user-is-member'>[]> {
  if (!octokit) throw new Error('Octokit not set up!');

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
query getRepos ($after: String) {
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

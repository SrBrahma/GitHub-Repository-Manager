import { octokit } from "../octokit";
import { RepositoryInterface } from '../../store/types';
import { getOctokitErrorMessage } from "./aux";

export function extractRepositoryFromData(node: any): RepositoryInterface {
  return {
    name: node.name,
    description: node.description,
    ownerLogin: node.owner.login,
    languageName: node.primaryLanguage?.name,
    url: node.url,

    isPrivate: node.isPrivate,
    isFork: node.isFork,
    isTemplate: node.isTemplate,
    userIsAdmin: node.viewerCanAdminister,

    // parent may be null if isn't a fork.
    parentRepoName: node.parent?.name,
    parentRepoOwnerLogin: node.parent?.owner.login,

    createdAt: new Date(node.createdAt),
    updatedAt: new Date(node.updatedAt)
  };
}


export async function getOrgRepos(login: string): Promise<RepositoryInterface[]> {
  try {
    const repos: RepositoryInterface[] = [];

    let endCursor: string | null = null;
    let hasNextPage = false;

    do {
      // https://github.com/octokit/graphql.js/#variables
      const response = (await octokit.graphql(orgRepoQuery, {
        after: endCursor,
        org: login
      }) as any);

      if (response.viewer.organization === null) {
        return repos;
      }

      const { nodes, pageInfo } = response.viewer.organization.repositories;

      ({ endCursor, hasNextPage } = pageInfo);

      repos.push(...nodes.map((node: any) => extractRepositoryFromData(node)));
    } while (hasNextPage);

    return repos;
  }
  catch (err) { // Octokit has a patter for errors, which we display properly at octokitErrorDisplay().
    throw new Error(getOctokitErrorMessage(err));
  }
}

export async function getRepos(): Promise<RepositoryInterface[]> {
  try {

    const repos: RepositoryInterface[] = [];

    // For pagination (if user has more repos than the query results (current max per query is 100))
    let endCursor: string | null = null;
    let hasNextPage = false;

    do {
      // https://github.com/octokit/graphql.js/#variables
      const { nodes, pageInfo } = (await octokit.graphql(query, {
        after: endCursor
      }) as any).viewer.repositories;

      ({ endCursor, hasNextPage } = pageInfo);

      repos.push(...nodes.map((node: any) => extractRepositoryFromData(node)));
    } while (hasNextPage);

    return repos;
  }

  catch (err) { // Octokit has a patter for errors, which we display properly at octokitErrorDisplay().
    throw new Error(getOctokitErrorMessage(err));
  }
}


// Made with https://developer.github.com/v4/explorer/
const query = `
query getRepos ($after: String) {
  viewer {
    repositories(
      first: 100,
      affiliations: [OWNER], ownerAffiliations:[OWNER],
      orderBy: {field: NAME, direction: ASC}, after: $after
    ) {

      pageInfo {
        endCursor
        hasNextPage
      }
      nodes {
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
      }
    }
  }
}`;


const orgRepoQuery = `
query getOrgRepos ($after: String, $org: String!) {
  viewer {
    organization(login: $org) {
      repositories(isFork: false, first: 100, after: $after) {
        pageInfo {
          endCursor
          hasNextPage
        }
        nodes {
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
          viewerCanAdminister
          parent {
            name
            owner {
              login
            }
          }
          createdAt
          updatedAt
        }
      }
    }
  }
}`;
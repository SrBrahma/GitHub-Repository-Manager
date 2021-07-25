import { Repository } from '../store/repository';
import { octokit } from '../store/user';
import { getOctokitErrorMessage } from './getErrorMessage';

export function extractRepositoryFromData(node: any): Repository {
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
    updatedAt: new Date(node.updatedAt),
  };
}


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
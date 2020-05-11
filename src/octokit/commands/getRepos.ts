import { octokit } from "../octokit";
import { Repository } from "../../Repository/Repository";
import { getOctokitErrorMessage } from "./aux";

export function extractRepositoryFromData(node: any) {
  return new Repository({
    name: node.name,
    description: node.description,
    ownerLogin: node.owner.login,
    languageName: node.primaryLanguage?.name,
    url: node.url,

    isPrivate: node.private,
    isFork: node.isFork,
    isTemplate: node.isTemplate,
    userIsAdmin: node.viewerCanAdminister,

    // parent may be null if isn't a fork.
    parentRepoName: node.parent?.name,
    parentRepoOwnerLogin: node.parent?.owner.login,
  });
}


export async function getRepos(): Promise<Repository[]> {
  try {

    const repos: Repository[] = [];

    // For pagination (if user has more repos than the query results (current max per query is 100))
    let endCursor: string | null = null;
    let hasNextPage = false;

    do {
      // https://github.com/octokit/graphql.js/#variables
      const { nodes, pageInfo } = (await octokit.graphql(query, {
        after: endCursor
      })).viewer.repositories;

      ({ endCursor, hasNextPage } = pageInfo);

      repos.push(...nodes.map((node: any) => extractRepositoryFromData(node)));
    } while (hasNextPage);

    return repos;
  }

  catch (error) { // Octokit has a patter for errors, which we display properly at octokitErrorDisplay().
    throw new Error(getOctokitErrorMessage(error));
  }
}


// Made with https://developer.github.com/v4/explorer/
const query = `
query getRepos ($after: String) {
  viewer {
    repositories(first: 100, orderBy: {field: NAME, direction: ASC}, after: $after) {
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
      }
    }
  }
}
`;
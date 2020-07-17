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

    isPrivate: node.isPrivate,
    isFork: node.isFork,
    isTemplate: node.isTemplate,
    userIsAdmin: node.viewerCanAdminister,

    // parent may be null if isn't a fork.
    parentRepoName: node.parent?.name,
    parentRepoOwnerLogin: node.parent?.owner.login,

    createdAt: new Date(node.createdAt),
    updatedAt: new Date(node.updatedAt)
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
      }) as any).viewer.repositories;

      ({ endCursor, hasNextPage } = pageInfo);

      repos.push(...nodes.map((node: any) => extractRepositoryFromData(node)));
    } while (hasNextPage);

    console.log(repos.length);

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
      affiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR], ownerAffiliations:[OWNER, ORGANIZATION_MEMBER, COLLABORATOR],
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
}
`;
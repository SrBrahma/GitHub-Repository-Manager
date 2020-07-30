import { getOctokitErrorMessage } from "./aux";
import { octokit } from "../octokit";
import { UserInterface, OrgInterface } from "../../store/types";

export async function getUser(): Promise<UserInterface> {
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
    if (err.errors.find((error: any) => error.type === 'INSUFFICIENT_SCOPES')) {
      throw new Error('Insufficient Access, please login to GitHub Repository Manager');
    }

    throw new Error(getOctokitErrorMessage(err));
  }
}
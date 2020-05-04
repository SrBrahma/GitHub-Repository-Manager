import { octokit } from "../octokit";
import { Repository } from "../../Repository/Repository";
import { getOctokitErrorMessage } from "./aux";

export function extractRepositoryFromData(data: any) {
  return new Repository({
    name: data.name,
    description: data.description,
    ownerLogin: data.owner.login,
    language: data.language,
    isFork: data.fork,
    isPrivate: data.private,
    userIsAdmin: data.permissions.admin,
    htmlUrl: data.html_url
  });
}

// could use graphql to reduce net usage.
export async function getRepos(): Promise<Repository[]> {
  try {
    const { data: datas } = await octokit.repos.listForAuthenticatedUser();
    const repos = datas.map((data: any) => extractRepositoryFromData(data));
    return repos;
  }
  catch (error) { // Octokit has a patter for errors, which we display properly at octokitErrorDisplay().
    throw new Error(getOctokitErrorMessage(error));
  }
}
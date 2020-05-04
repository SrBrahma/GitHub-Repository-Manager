import { getOctokitErrorMessage } from "./aux";
import { octokit } from "../octokit";
import { UserInterface } from "../../User/User";

export async function getUser(): Promise<UserInterface> {
  try {
    const { data: userData } = await octokit.request('/user');
    return {
      login: userData.login,
      name: userData.name,
      avatarUri: userData.avatar_url,
      profileUri: userData.html_url
    };
  }
  catch (error) { // Octokit has a pattern for errors, which we display properly at octokitErrorDisplay().
    throw new Error(getOctokitErrorMessage(error));
  }
}
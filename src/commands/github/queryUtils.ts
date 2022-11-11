import type { Repository } from '../../store/repository';

export function extractRepositoryFromData(
  data: any,
): Repository<false, 'user-is-member'> {
  return {
    name: data.name,
    description: data.description,
    ownerLogin: data.owner.login,
    languageName: data.primaryLanguage?.name,
    url: data.url,

    isPrivate: data.isPrivate,
    isFork: data.isFork,
    isTemplate: data.isTemplate,

    // parent may be null if isn't a fork.
    parentRepoName: data.parent?.name,
    parentRepoOwnerLogin: data.parent?.owner.login,

    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
}

/** Used for both orgRepos and userRepos.
 *
 * The different indendation from query doesn't matter. https://stackoverflow.com/q/62398415/10247962 */

export const repoInfosQuery = `
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
`;

function upperCaseFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// We change a little the default error octokit outputs.
// TODO: As we are using Graphql (doesn't have error.status as the v3 REST API),
// this function is partially deprecated, needs to be updated
export function getOctokitErrorMessage(error: any): string {
  function defaultErrorMsg() {
    // name + code + : + message Ex: Http Error 500: Bla bla bla
    return `${error.name} ${error.status} : ${upperCaseFirstLetter(error.message)}`;
  }
  function customErrorMsg(msg: string) {
    return `${msg} [${defaultErrorMsg()}]`;
  }

  let errorMessage = '';
  switch (error.status) {
    case 401:
      errorMessage = customErrorMsg(
        'The entered or stored token is wrong, has expired or has been revoked! If you want, authenticate again!',
      );
      break;
    case 500:
      errorMessage = customErrorMsg('Looks like your internet is off!');
      break;
    default:
      errorMessage = defaultErrorMsg();
  }
  return errorMessage;
}

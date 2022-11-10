export function upperCaseFirstLetter(string: string): string {
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

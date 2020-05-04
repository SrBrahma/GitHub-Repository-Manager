import { upperCaseFirstLetter } from "../../aux";



// We change a little the default error octokit outputs.
export function getOctokitErrorMessage(error: any) {
  function defaultErrorMsg() {
    // name + code + : + message Ex: Http Error 500: Bla bla bla
    return `${error.name} ${error.status} : ${upperCaseFirstLetter(error.message)}`;
  }
  function customErrorMsg(msg: string) {
    return `${msg} ${defaultErrorMsg()}`;
  }

  let errorMessage = '';
  switch (error.status) {
    case 401:
      errorMessage = customErrorMsg('Looks like the provided token is wrong!'); break;
    case 500:
      errorMessage = customErrorMsg('Looks like your internet is off!'); break;
    default:
      errorMessage = defaultErrorMsg();
  }
  return errorMessage;
}
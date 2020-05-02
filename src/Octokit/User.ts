// Used namespace to use it at least once in life and to have Status under user.
// Could have done it by other means.
export namespace user {
  export enum Status {
    notLogged, logging, errorLogging, logged
  }
  export let status: Status = Status.notLogged;
  export let login = '';
  export let name = '';
  export let avatarUri = '';
  export let profileUri = '';
}

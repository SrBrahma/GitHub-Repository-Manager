// Used namespace to use it at least once in life and to have Status under user.

// import { window } from 'vscode';
import { getUser } from '../octokit/commands/getUser';
import { getOrgRepos } from '../octokit/commands/getRepos';

import { createStore } from 'redux';
import { UserInterface, UserStatus, OrgInterface, OrgStatus } from './types';

// We create a default org for the user for repositories they own directly to go into
function createDefaultOrg(userLogin: string): OrgInterface {
  return {
    id: userLogin,
    name: userLogin,
    status: OrgStatus.notLoaded,
    repositories: [],
  };
}

function addOrgMetaData(org: any) {
  return {
    ...org,
    status: OrgStatus.notLoaded,
    repositories: [],
  };
}

function data(state: UserInterface = {
  login: '',
  profileUri: '',
  organizations: [],
  status: UserStatus.notLogged
}, action: any) {
  switch (action.type) {
    case 'UPDATE_USER':
      state = {
        ...action.value,
        organizations: [
          createDefaultOrg(action.value.login),
          ...action.value.organizations.map(addOrgMetaData),
        ]
      };
      break;
    case 'ATTACH_REPOS':
      state.organizations = state.organizations.map((org) => {
        if (action.value.id === org.id) {
          return action.value;
        } else {
          return org;
        }
      });
      break;
    default:
      break;
  }

  return state;
}

const dataStore = createStore(data);

export default dataStore;

export async function loadUser() {
  const user = await getUser();
  dataStore.dispatch({ type: 'UPDATE_USER', value: { ...user, status: UserStatus.logged } });
};

export async function loadRepos() {
  console.log('load');
  try {
    const user = dataStore.getState();

    if (user.login === '') {
      throw new Error('User not logged in');
    }

    const notLoggedInOrgs = user.organizations.filter(org => org.status === OrgStatus.notLoaded);

    await Promise.all(notLoggedInOrgs.map(loadOrgRepos));
  } catch (error) {

  }
}

async function loadOrgRepos(org: OrgInterface) {
  const repos = await getOrgRepos(org.name);
  console.log(repos);
  dataStore.dispatch({ type: 'ATTACH_REPOS', value: { ...org, repos, status: OrgStatus.loaded } });
}
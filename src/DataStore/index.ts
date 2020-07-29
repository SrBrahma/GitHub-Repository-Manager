// Used namespace to use it at least once in life and to have Status under user.

// import { window } from 'vscode';
import { getUser } from '../octokit/commands/getUser';
import { getOrgRepos, getRepos } from '../octokit/commands/getRepos';

import { createStore } from 'redux';
import { UserInterface, UserStatus, OrgInterface, OrgStatus } from './types';

// We create a default org for the user for repositories they own directly to go into
function createDefaultOrg(userLogin: string): OrgInterface {
  return {
    id: userLogin,
    name: userLogin,
    login: userLogin,
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
    case 'ORG_LOADING':
      state.organizations = state.organizations.map((org) => {
        if (action.value.id === org.id) {
          org.status = OrgStatus.loading;
        }

        return org;
      });
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
  try {
    const user = dataStore.getState();

    if (user.login === '') {
      throw new Error('User not logged in');
    }

    const notLoggedInOrgs = user.organizations.filter(org => org.status === OrgStatus.notLoaded);

    await Promise.all(notLoggedInOrgs.map(loadOrgRepos));
  } catch (error) {
    console.log(error);
  }
}

async function loadOrgRepos(org: OrgInterface) {
  const user = dataStore.getState();
  dataStore.dispatch({ type: 'ORG_LOADING', value: { ...org } });

  const repositories = user.login === org.name ? await getRepos() : await getOrgRepos(org.login);
  dataStore.dispatch({ type: 'ATTACH_REPOS', value: { ...org, repositories, status: OrgStatus.loaded } });
}
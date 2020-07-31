import { createStore } from 'redux';
import { User, UserStatus, Org, OrgStatus } from './types';

// We create a default org for the user for repositories they own directly to go into
function createDefaultOrg(userLogin: string): Org {
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

function data(state: User = {
  login: '',
  profileUri: '',
  organizations: [],
  status: UserStatus.notLogged,
  localRepos: []
}, action: any) {
  switch (action.type) {
    case 'UPDATE_USER':
      state = {
        ...state,
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
    case 'ATTACH_LOCAL_REPOS':
      state.localRepos = action.value;
      break;
    default:
      break;
  }

  return state;
}

export const dataStore = createStore(data);

export default dataStore;


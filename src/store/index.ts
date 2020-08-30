import { createStore } from 'redux';
import { User, Org, OrgStatus, UserStatus } from './types';
import { initialUser } from './helpers';

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

function data(state: User = initialUser(), action: any) {
  switch (action.type) {
    case 'USER_LOADING':
      state.status = UserStatus.logging;
      break;
    case 'USER_ERROR':
      state.status = UserStatus.errorLogging;
      break;
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
        if (action.value.id === org.id)
          org.status = OrgStatus.loading;
        return org;
      });
      break;
    case 'ORG_ERROR':
      state.organizations = state.organizations.map((org) => {
        if (action.value.id === org.id)
          org.status = OrgStatus.errorLoading;
        return org;
      });
      break;
    case 'ATTACH_REPOS':
      state.organizations = state.organizations.map((org) => {
        if (action.value.id === org.id) {
          return action.value;
        } else
          return org;
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


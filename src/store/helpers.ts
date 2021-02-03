import { getUser } from '../octokit/commands/getUser';
import { getOrgRepos, getUserRepos } from '../octokit/commands/getRepos';
import { UserStatus, Org, OrgStatus, Repository, LocalRepository, User } from './types';
import { getLocalReposPathAndUrl } from '../utils/searchClonedRepos';
import { dataStore } from './index';

export function initialUser(): User {
  return {
    login: '',
    profileUri: '',
    organizations: [],
    status: UserStatus.notLogged,
    localRepos: []
  };
}

export async function loadUser() {
  try {
    dataStore.dispatch({ type: 'USER_LOADING' });
    const user = await getUser();
    dataStore.dispatch({
      type: 'UPDATE_USER', value: {
        ...user,
        status: UserStatus.logged
      }
    });
  }
  catch (err) {
    dataStore.dispatch({ type: 'USER_ERROR' });
    throw new Error(err);
  }
}


// Should be executed after loadLocalRepos
export async function loadRepos() {
  const user = dataStore.getState();

  if (user.login === '') {
    throw new Error('User not logged in');
  }

  const notLoggedInOrgs = user.organizations.filter(org => org.status === OrgStatus.notLoaded);

  await Promise.all(notLoggedInOrgs.map(loadOrgRepos));
}

async function loadLocalRepos() {
  const localRepos = await getLocalReposPathAndUrl();
  dataStore.dispatch({ type: 'ATTACH_LOCAL_REPOS', value: localRepos });
}

async function loadOrgRepos(org: Org) {
  try {

    const { login, localRepos } = dataStore.getState();
    dataStore.dispatch({ type: 'ORG_LOADING', value: { ...org } });

    const repos = (login === org.name) ? await getUserRepos() : await getOrgRepos(org.login);

    // console.log('repos: ', repos);

    // We want to append the local path to any repositories so we know where to find them on disc
    const reposWithLocalPath = repos.map((repo) => {
      for (let i = 0; i < localRepos.length; i++) {
        const localRepo: LocalRepository = localRepos[i];

        if (repo.url === localRepo.gitUrl) {
          repo.localPath = localRepo.dirPath;
          break;
        }
      }

      return repo;
    });

    dataStore.dispatch({ type: 'ATTACH_REPOS', value: { ...org, repositories: reposWithLocalPath, status: OrgStatus.loaded } });
  }
  catch (err) {
    dataStore.dispatch({ type: 'ORG_ERROR', value: { ...org } });
    throw new Error(err);
  }
}

export function notCloned(repos: Repository[]): Repository[] {
  return repos.filter(repo => !repo.localPath);
}

export function cloned(repos: Repository[]): Repository[] {
  return repos.filter(repo => repo.localPath);
}


export async function loadUserAndRepos() {
  await Promise.all([loadUser(), loadLocalRepos()]); // Simultaneously to improve the performance by a bit
  await loadRepos();
}

export async function reloadRepos() {
  await loadUserAndRepos();
}

export async function logout() {
  dataStore.dispatch({ type: 'UPDATE_USER', value: initialUser() });
}

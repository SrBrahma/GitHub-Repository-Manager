import { getUser } from '../octokit/commands/getUser';
import { getOrgRepos, getRepos } from '../octokit/commands/getRepos';
import { UserStatus, Org, OrgStatus, Repository, LocalRepository } from './types';
import { searchLocalReposAndSetRepoPath } from '../utils/searchClonedRepos';
import { dataStore } from './index';

export async function loadUser() {
    const user = await getUser();
    dataStore.dispatch({ type: 'UPDATE_USER', value: { ...user, status: UserStatus.logged } });
}

export async function loadRepos() {
    try {
        const user = dataStore.getState();

        if (user.login === '') {
            throw new Error('User not logged in');
        }

        const notLoggedInOrgs = user.organizations.filter(org => org.status === OrgStatus.notLoaded);

        await loadLocalRepos(); // Should be fast and is necessary before we fetch from github
        await Promise.all(notLoggedInOrgs.map(loadOrgRepos));
    }
    catch (error) {
        console.log(error);
    }
}

async function loadLocalRepos() {
    const localRepos = await searchLocalReposAndSetRepoPath();
    dataStore.dispatch({ type: 'ATTACH_LOCAL_REPOS', value: localRepos });
}

async function loadOrgRepos(org: Org) {
    const { login, localRepos } = dataStore.getState();
    dataStore.dispatch({ type: 'ORG_LOADING', value: { ...org } });

    const repositories = login === org.name ? await getRepos() : await getOrgRepos(org.login);

    // We want to append the local path to any repositories so we know where to find them on disc
    const reposWithLocalPath = repositories.map((repo) => {
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

export function notCloned(repos: Repository[]): Repository[] {
    return repos.filter(repo => !repo.localPath);
}

export function cloned(repos: Repository[]): Repository[] {
    return repos.filter(repo => repo.localPath && repo.localPath.length);
}

export async function reloadRepos() {
    await loadUser();
    await loadRepos();
}
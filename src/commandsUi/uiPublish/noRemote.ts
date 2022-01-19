import execa from 'execa';
import { getHeadBranch } from '../../commands/git/getHead';
import { getRepositoryGitUrl } from '../../commands/git/getRepositoryGitUrl';
import { gitHasRemote } from '../../commands/git/gitHasRemote/gitHasRemote';
import { User } from '../../store/user';
import { myQuickPick } from '../../vscode/myQuickPick';
import { NewRepository } from '../uiCreateRepo';


/** If returned undefined, do exit. */
export async function preNoRemote({ cwd }: {cwd: string}): Promise<void> {
  if (await gitHasRemote(cwd))
    throw new Error('Project already contains git remote!');
}

export async function preRepositoryCreateNoRemote(
  { cwd }: {cwd: string},
): Promise<{headBranch: string} | undefined> {
  const originalHeadBranch = await getHeadBranch(cwd);
  let headBranch = originalHeadBranch;

  // We do this before Repository creation so user may safely cancel this prompt.
  if (originalHeadBranch === 'master') {
    const convertMasterToMain = (await myQuickPick({
      ignoreFocusOut: false,
      items: [{ label: 'Yes' }, { label: 'No' }],
      title: "Rename local 'master' branch to 'main' before pushing to GitHub?",
    }))?.label;

    if (convertMasterToMain === undefined)
      return; // Exit on cancel

    if (convertMasterToMain === 'Yes') {
      // Check if main branch already exists
      const branchesString = (await execa('git', ['branch'], { cwd })).stdout; // Multiline branches names. May contain whitespaces before/after its name.
      const mainBranchExists = branchesString.match(/\bmain\b/g); // https://stackoverflow.com/q/2232934/10247962
      if (mainBranchExists)
        throw new Error("Branch 'main' already exists!");
      // Rename master to main
      await execa('git', ['branch', '-m', 'master', 'main'], { cwd });
      headBranch = 'main';
    }
  }
  return { headBranch };
}

export async function posNoRemote({ cwd, newRepository, headBranch }: {
  cwd: string;
  newRepository: NewRepository;
  headBranch: string;
}): Promise<void> {
  const repositoryUrl = newRepository.html_url; // this prop is the right one, = 'https://github.com/author/repo'
  const remoteUrl = repositoryUrl + '.git';

  await execa('git', ['remote', 'add', 'origin', remoteUrl], { cwd });

  // Set the HEAD branch remote manually (without push -u etc, as it requires git auth)
  await execa('git', ['config', '--local', `branch.${headBranch}.remote`, 'origin'], { cwd });
  await execa('git', ['config', '--local', `branch.${headBranch}.merge`, `refs/heads/${headBranch}`], { cwd });

  // Push local to GitHub. Note that user may have a dirty local, but we will leave the next commit to him.
  const tokenizedRepositoryUrl = getRepositoryGitUrl({
    owner: newRepository.owner.login,
    repositoryName: newRepository.name,
    token: User.token!,
  });
  await execa('git', ['push', tokenizedRepositoryUrl], { cwd });
}
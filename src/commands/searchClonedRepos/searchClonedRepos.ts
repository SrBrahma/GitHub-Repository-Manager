import path from 'path';
import execa from 'execa';
import GitUrlParse from 'git-url-parse';
import globby from 'globby';
import { Configs } from '../../main/configs';



interface DirWithGitUrl {
  dirPath: string;
  gitUrl: string;
}
async function getGitUrls(dirsPath: string[]): Promise<DirWithGitUrl[]> {
  const dirsWithGitUrl: DirWithGitUrl[] = [];

  // forEach would call all execs 'at the same time', as it doesnt wait await.
  for (const dirPath of dirsPath) {
    try {
      // https://stackoverflow.com/a/23682620/10247962
      // was using git remote -v, but git ls-remote --get-url seems to also do the job with a single output.
      const { stdout: result } = await execa('git', ['ls-remote', '--get-url'], { cwd: dirPath });

      // Remove whitespaces chars.
      const url = result.trim();

      if (url) {
        // Parse the git URL into a repository URL, as it could be the git@github.com:author/reponame url pattern.
        // This changes any known kind to the https://github.com/author/reponame pattern.
        const gitUrl = GitUrlParse(url).toString('https').replace(/\.git$/, ''); // remove final .git
        dirsWithGitUrl.push({ gitUrl, dirPath });
      }
    } catch (err: any) {
      // If error, it's because there isn't a remote. No need to manage it, may be left empty.
    }
  }
  return dirsWithGitUrl;
}


export let noLocalSearchPaths: boolean = false;


interface StartingSearchPaths {
  path: string;
  availableDepth: number;
}
function getStartingSearchPaths(): StartingSearchPaths[] {
  const searchPaths: StartingSearchPaths[] = [];

  if (Configs.gitDefaultCloneDir)
    searchPaths.push({
      path: Configs.gitDefaultCloneDir,
      availableDepth: Configs.defaultCloneDirectoryMaximumDepth,
    });

  return searchPaths;
}


// TODO: Add custom dirs
// This method returns all found git folders in the search location regardless if they are in the users Github or not
export async function getLocalReposPathAndUrl(): Promise<DirWithGitUrl[]> {
  // If the user don't have any repository in GitHub

  // Get starting search paths.
  const startingSearchPaths = getStartingSearchPaths();
  console.log('starting', startingSearchPaths);
  if (startingSearchPaths.length === 0) {
    noLocalSearchPaths = true;
    return [];
  }

  noLocalSearchPaths = false; // Reset it if was true

  // Get local repositories paths.
  const repositoriesPaths: string[] = [];
  const dirsToSkip = Configs.directoriesToIgnore;
  for (const startingSearchPath of startingSearchPaths)
    repositoriesPaths.push(...(await globby('**/.git/config', {
      deep: startingSearchPath.availableDepth + 2, // +2 for .git/config
      cwd: startingSearchPath.path,
      followSymbolicLinks: false,
      absolute: true,
      ignore: dirsToSkip.map((d) => `**/${d}`),
      caseSensitiveMatch: false,
    })
    ).map((e) => path.resolve('../..')),
    );

  return await getGitUrls(repositoriesPaths);
}

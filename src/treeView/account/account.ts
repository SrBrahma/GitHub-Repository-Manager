import vscode, { ThemeIcon } from 'vscode';
import { TreeItem, BaseTreeDataProvider } from '../treeViewBase';
import { User, UserState } from '../../store/user';

export let accountTreeDataProvider: TreeDataProvider;

export function activateTreeViewAccount(): void {
  accountTreeDataProvider = new TreeDataProvider();
  vscode.window.registerTreeDataProvider('githubRepoMgr.views.account', accountTreeDataProvider);

  User.subscribe('account', () => { accountTreeDataProvider.refresh(); });

  // Open user profile page
  vscode.commands.registerCommand('githubRepoMgr.commands.user.openProfilePage', async () => {
    if (User.profileUri)
      await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(User.profileUri));
  });

  // Open Extension README
  // vscode.commands.registerCommand('githubRepoMgr.commands.user.openReadme', async () => {
  //   if (User.profileUri)
  //     await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('https://github.com/SrBrahma/GitHub-Repository-Manager#github-repository-manager'));
  // });

}


// There is a TreeItem from vscode. Should I use it? But it would need a workaround to
// avoid using title in command.
class TreeDataProvider extends BaseTreeDataProvider {

  constructor() { super(); }

  getData() {
    switch (User.state) {
      case UserState.errorLogging: // TODO: Bad when token already stored and we have a connection error
        return new TreeItem({ label: 'An error happened!' });
      case UserState.notLogged: // If going to change it, beware it is also being used in helpers.loadUser().
        return []; // Empty, do show nothing.
      case UserState.init:
      case UserState.logging:
        return new TreeItem({ label: 'Loading...' });
      case UserState.logged:
        return getLoggedTreeData();
    }
  }

  protected makeData() {
    this.data = this.getData();
  }

}


export function getLoggedTreeData(): TreeItem[] {
  return [
    new TreeItem({
      label: `Hi, ${User.login}!`,
      iconPath: new ThemeIcon('verified'),
      children: [
        // That space before the label improves readability (that the icon reduces, but they look cool!)
        new TreeItem({
          label: ' Open your GitHub page',
          command: 'githubRepoMgr.commands.user.openProfilePage',
          iconPath: new ThemeIcon('github'),
        }),
        // new TreeItem({
        //   label: ' Open extension Readme',
        //   command: 'githubRepoMgr.commands.user.openReadme',
        //   iconPath: new ThemeIcon('notebook'),
        // }), // TODO Looked awful, annoying. Find a better way to point to it.
      ],
    }),
  ];
}
<h1 align="center">
<b>GitHub Repository Manager</b>
</h1>

<h3 align="center">
Lists your personal and organizations GitHub repositories, allowing you to clone them and creating new ones, directly from your VS Code
</h3>

<div align="center">

[![Version](https://vsmarketplacebadge.apphb.com/version/henriquebruno.github-repository-manager.svg)](https://marketplace.visualstudio.com/items?itemName=henriqueBruno.github-repository-manager)
[![Installs](https://vsmarketplacebadge.apphb.com/installs-short/henriquebruno.github-repository-manager.svg)](https://marketplace.visualstudio.com/items?itemName=henriqueBruno.github-repository-manager)

</div>

<br/>



<div align="center">
<img src="https://raw.githubusercontent.com/SrBrahma/GitHub-Repository-Manager/master/images/README_md/usage.gif" width="85%" >
</div>
<br/>


<h1 align="center">
Guide
</h1>

<h2><b>Login with OAuth</b></h2>

Under **Login with**, click on the **OAuth -> Open in browser** or **OAuth -> Copy link to clipboard** and paste that link on your browser (useful if your VSCode is having trouble opening the browser). Authenticate, and on success, it will redirect to a localhost web page, hosted under the port 60002, by default. You are now logged! You may close the redirect page.

Under the hoods, it's returned to you a token via the localhost redirect, similar to the Personal access token.

Uses Vercel to handle the OAuth token generation (https://github.com/SrBrahma/micro-github hosted on https://micro-github.srbrahma.now.sh/).

If this method is not working, you may try the method below.


<h2><b>Login with Personal access token</b></h2>

To login using a Personal access token, go to your GitHub web page, Settings, Developer settings, Personal access tokens, mark the **repo** and **read:org** options, click on the **Generate token** button, and your token will show up. You may now enter it on **Personal access token**, under **Login with**.

<img src="https://raw.githubusercontent.com/SrBrahma/GitHub-Repository-Manager/master/images/README_md/personalAccessToken.png" alt="Personal access token" width="60%" >


<h2><b> Cloning a repository </b></h2>

Left-click a repository under Not Cloned list or right-click it and select **Clone to**, then select the destination directory. Upon completion, you may choose to open it.

The default destination path is the **"git.defaultCloneDirectory"** VSCode setting, or if not set, it's your OS home directory. Read more about this defaultCloneDirectory on the **Cloned Repositories Search** topic below.


<h2><b> Creating a repository </b></h2>

While hovering the **REPOSITORIES** tree view title, a plus (**+**) button appears. Click it, and enter the new repository name (follows the same naming rules as creating a repository on GitHub), description (optional, may be left blank), and visibility (private or public). On success, you may choose to clone it.


<h2><b> Cloned Repositories Search </b></h2>

To make your GitHub cloned repositories show up in the **Cloned** tree on the **REPOSITORIES** tree view, you will need to set the **"git.defaultCloneDirectory"** setting on your VSCode settings.json file to an absolute path where your cloned repositories are located (may be on a deep directory), so our Searcher will look for your GitHub repositories there. You may use **"\~"** to point to your home directory if on Linux. If on Windows, you must use the "X:\\folder1\\folderX" style. I usually store my repos under **"\~/Dev"**, so that's what I use as my **"git.defaultCloneDirectory"** value. It's already planned to allow setting more than one directory as a serching directory. Read about **Cloned Repositories Search** configurations on its Settings topic below.


<br/>
<h1 align="center"> Settings </h1>

<h2><b> General </b></h2>

- ## Save Token
##### _"githubRepositoryManager.saveToken"_
By default, when closing the VSCode, your token (OAuth or Personal access token) is forgotten, and on each VSCode opening, you will need to login again to use this extension functionalities. This setting saves the token (OAuth or Personal access token) in an internal file. You must be careful while using this option, as malicious extensions and applications can retrieve the stored token and read and write to your repositories (but not delete). The stored token is removed from the disk when "Logout and forget token" is clicked when logged. You can also delete at any time your Personal access token on GitHub website > Settings > Developer settings > Personal access token, and your OAuth under GitHub website > Settings > Applications > Authorized OAuth Apps.

But, while the GitHub Repository Manager is an uknown extension, you surely won't have problems using this option. Will be improved in future versions.
##### Default: false


- ## Show Repository Commands Icons
##### _"githubRepositoryManager.showRepositoryCommandsIcons"_
When hovering a repository in the tree view, shows some common commands icons for quick use. You may also call them via the right-click menu, being this setting enabled or not. Requires restart after changing to take effect.

<img src="https://raw.githubusercontent.com/SrBrahma/GitHub-Repository-Manager/master/images/README_md/config/showRepositoryCommandsIcons.png" alt="Show Repository Commands Icons">

##### Default: true

<br/>
<h2> <b> Repositories Search </b></h2>

- ## Always clone to "git.defaultCloneDirectory"
##### _"githubRepositoryManager.alwaysCloneToDefaultDirectory"_
Always clone to the directory specified in "git.defaultCloneDirectory"
##### Default: false

- ## Default Clone Directory Maximum Depth
##### _"githubRepositoryManager.clonedRepositoriesSearch.defaultCloneDirectoryMaximumDepth"_
How deep on "git.defaultCloneDirectory" local cloned repositories will be searched. A depth of 0 means it will only search on the directory itself, a depth of 3 means it will search up to 3 directories below.
##### Default: 3


- ## Directories To Ignore
##### _"githubRepositoryManager.clonedRepositoriesSearch.directoriesToIgnore"_
Directories names to not search for repositories in them.
##### Default: ["node_modules", ".vscode"]


- ## Search On Default Clone Directory
##### "githubRepositoryManager.clonedRepositoriesSearch.searchOnDefaultCloneDirectory"_
Search for cloned repos on the "git.defaultCloneDirectory" path setting. Only applies if 'git.defaultCloneDirectory' is set.

At the current (v0.2.0), cloned repositories may only be found using this option.
##### Default: true


<br/>
<h1 align="center">
  <a href="https://github.com/SrBrahma/GitHub-Repository-Manager/blob/master/CHANGELOG.md">
      Changelog
  </a>
</h1>

<br/>
<h1 align="center"> Roadmap </h1>

- Resolve current issues

- Add other paths than git.defaultCloneDirectory to local cloned repositories search

- Search and clone public repositories

- Message when this extension updates to a new major version

- Only show Repository creation icon when logged

- Extension Settings description using markdown

- Git not installed message

- Other repositories found by the Cloned Repository Searcher. Useful for quickly opening a repository you don't own.

- Default action on clone (ask, open, new window, workspace)

- Visualize without cloning (useful for getting some value or checking something from some repository)

- "Order by" (alphabetically, stars, your open frequency, created on, updated on) in top menu

- Search repo

- "Group by number of repos" - showing 20 cloned repos is a little distractive. Would work nice with "Order by" and only show those 5 repos you usually work on.

- Add color to those repos icons

- Remove cloned from local if it isn't dirty (= not locally diff from github) (add icon to dirty repos)

<br/>
<h2 align="center"> Feel free to open an issue for features requests, problems or questions! </h2>


<br/>
<h1 align="center"> Donation </h1>

<h3 align="center">
  Help me to keep and improve this project! Greater functionalities are coming!
  </br></br>
</h3>

<!-- Without this div, it wasn't being centered on the marketplace. -->
<div align="center">
<a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=6P2HYMMC2VWMG">
    <img src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" alt="Paypal">
</a>
</div>

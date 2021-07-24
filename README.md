<div align="center">

[![Version](https://vsmarketplacebadge.apphb.com/version/henriquebruno.github-repository-manager.svg)](https://marketplace.visualstudio.com/items?itemName=henriqueBruno.github-repository-manager)
[![Installs](https://vsmarketplacebadge.apphb.com/installs-short/henriquebruno.github-repository-manager.svg)](https://marketplace.visualstudio.com/items?itemName=henriqueBruno.github-repository-manager)

</div>
<h1 align="center">
<b>GitHub Repository Manager</b>
</h1>

<h3 align="center">
VS Code extension that lists your personal and organizations GitHub repositories, allowing you to clone and access them and create new ones
</h3>


<br/>



<div align="center">
<img src="https://raw.githubusercontent.com/SrBrahma/GitHub-Repository-Manager/master/images/readme/usage.gif" width="85%" >
</div>
<br/>

_This gif is a little old! We are now using the VS Code integrated GitHub login system and the extension is prettier! The gif will be eventually updated!_


<h1 align="center">
Guide
</h1>


<!-- Maybe not needed. See if someone asks on how to do it. <h2><b> Log in </b></h2>

**[1.0.0]** We are now using the VS Code integrated GitHub login system!

![](images/readme/login.png)

<h2><b> Log out </b></h2>

To logout in this new VS Code system, remove it from the Trusted Extensions. In the next VS Code session, the extension won't have access to your account. Note that if

![](images/readme/logout1.png) ![](images/readme/logout2.png) -->


<h2><b> Cloned Repositories Search </b></h2>

To make your GitHub cloned repositories show up in the **Cloned** tree view, you will need to set the **`"git.defaultCloneDirectory"`** on your VSCode `settings.json` file to an absolute path where your cloned repositories are located (may be deep). On Linux you may use **"\~"** to point to your home directory. On Windows, you must use the `"X:\\folderA\\folderB"` pattern.

I store my repos under **"\~/Dev"**, so that's what I use as my **"git.defaultCloneDirectory"** value.


<h2><b> Creating a repository </b></h2>

While hovering the **REPOSITORIES** tree view title, a plus (**+**) button appears. Click on it, and enter the new repository name, description (optional) and visibility. On success, you may choose to clone the new repository.



<br/>
<h1 align="center"> Settings </h1>


- ### Always Clone To Default Directory
##### _"githubRepositoryManager.alwaysCloneToDefaultDirectory"_
Always clone to the directory specified in "git.defaultCloneDirectory".
##### Default: **false**


- ### Colored Icons
##### _"githubRepositoryManager.coloredIcons"_
Colors the repositories icons.

##### Default: **true**

![](images/readme/config/coloredIconsTrue.png) ![](images/readme/config/coloredIconsFalse.png)

_Those `*` means that the repository is **dirty**! It means that it has local changes that weren't yet commited! Please, report errors with it! I will soon add an option to individually Delete non-dirty repositories!_


- ## Default Clone Directory Maximum Depth
##### _"githubRepositoryManager.clonedRepositoriesSearch.defaultCloneDirectoryMaximumDepth"_
How deep on `"git.defaultCloneDirectory"` the cloned repositories will be searched. A depth of 0 means it will only search in the directory itself, a depth of 3 means it will search up to 3 directories below.
##### Default: **3**


- ## Directories To Ignore
##### _"githubRepositoryManager.clonedRepositoriesSearch.directoriesToIgnore"_
Directories names that our cloned repositories searcher will ignore.
##### Default: **["node_modules", ".vscode", ".git"]**


<br/>

<h1 align="center">
  <a href="https://github.com/SrBrahma/GitHub-Repository-Manager/blob/master/CHANGELOG.md">
      Changelog
  </a>
</h1>

<h1 align="center"> Roadmap </h1>

- Search and clone public repositories

- Only show Repository creation icon when logged

- Git not installed message

- Other repositories found by the Cloned Repository Searcher. Useful for quickly opening a repository you don't own.

- Visualize without cloning (useful for getting some value or checking something from some repository)

- "Order by" (alphabetically, stars, your open frequency, created on, updated on) in top menu

- Search repository by name

- Fetch repositories on demand - Some devs have hundreds or thousands of repos. Instead of fetching all of them on init and displaying all of them together, there could be a \[1..100\], \[101, 200\] tree system, for both on demand fetch and display.

- Remove cloned from local if it isn't dirty (= not locally diff from github)

<br/>
<h2 align="center"> Feel free to open an issue for features requests, problems or questions! </h2>

<h4 align="center">

For developing: clone it, run `npm i`, `npm start` and run the debugger.

</h4>

<br/>
<h1 align="center"> Donation </h1>

<h3 align="center">
  Help me to keep and improve this project!
  <br/>
</h3>

<!-- Without this div, it wasn't being centered on the marketplace. -->
<div align="center">
<a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=6P2HYMMC2VWMG">
    <img src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" alt="Paypal">
</a>
</div>

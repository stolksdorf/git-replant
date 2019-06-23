# 🌱 `git replant`

Rebase an entire git subtree to a new root

```
rebases a branch and all descendant branches to a new root while preserving the tree structure.

    $ git replant A M

    * M
    |                  * C
    | * C              * B
    | * B              | * D, E
    | | * D, E   -->   |/
    | |/               * A
    | * A              * M
    |/                 *
    *

usage: git replant [options] <branch> <new root branch>
   or: git replant --continue | --abort

Available options are
    -v, --version     display git replant version
    --dry-run         display what actions this command will take, but not execute them
    --auto            adds '-Xtheirs' to all rebase commands. When resolving conflicts will use subtree's changes.
    *                 all other options will be passed through to the internal rebase calls.

Actions:
    --continue        continue the replant
    --abort           aborts and returns git tree to original state
```


## install

### with node installed
1. download this repo
1. make a file called `git-replant` in your `$HOME/bin` folder with the following contents

```bash
#!/bin/bash
node /path/to/download/repo/git-replant "$@"
```

### with executable
Copy the `bin/git-replant.exe` into your `$HOME/bin` folder

*Note*: The exe was created using [`pkg`](https://www.npmjs.com/package/pkg) via the `npm run build` command if you wish to build it yourself.



## features
- creates temporary git files to track progress and aborts
- sibling branches are rebased to the exact same SHA
- makes sure your target isn't downstream from your base



## how it works

1. start with the `new root`, the `new root`'s old SHA, and a `target` branch to move.
1. Remember the `target`'s current SHA, and find all direct descendant branches.
1. [`rebase --onto [new root] [old sha]`](https://stackoverflow.com/questions/29914052/i-cant-understand-the-behaviour-of-git-rebase-onto). Rebase the branch to the new root, starting from the old commit, thus preserving the tree structure.
1. Repeat this process with each direct descendant of the `target` with `target` being the `new root`

---

## why use this?
If you are working in a project with others and 1) want to have small PRs, and 2) want a good review process for your PRs, eventually you'll have feature branches that depend on each other.

If new work gets commited to master, you want to update all of your current feature branches, and their dependant branches. Unfortunately this process is quite tedious and prone to user-error.

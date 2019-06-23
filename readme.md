# 🌱 git replant



## options
- `dry` only prints out the commands
- `continue` if there exists a temp file, it continues using that
- All other params are passed




### install

#### with node
Make a file called `git-replant` in your `HOME/bin` folder

```bash
#!/bin/bash
node /path/to/cloned/git-replant "$@"
```

#### with executable
Copy the `bin/git-replant.exe` into your `[HOME]/bin` folder

*Note*: The exe was created using [`pkg`](https://www.npmjs.com/package/pkg) via the `npm run build` command if you wish to build it yourself.




### how it works

1. start with the `new root`, the `new root`'s old SHA, and a `target` branch to move.
1. Remember the `target`'s current SHA, and find all direct descendant branches.
1. [`rebase --onto [new root] [old sha]`](https://stackoverflow.com/questions/29914052/i-cant-understand-the-behaviour-of-git-rebase-onto). Rebase the branch to the new root, starting from the old commit, thus preserving the tree structure.
1. Repeat this process with each direct descendant of the `target` with `target` being the `new root`

---------------


### Why use this?

okay so the first half is my history. the second is the output of the command.

```
* dd05107 (master) added a file
| * 5533678 (featD) feet!
|/
| * 078a33c (featB2) new line of foo
| * 5e6d172 (featB) double
| * ca8b071 yo -> foo
| | * 798a72a (featA-b, featA) Fourth yo
| |/
| * 27751a8 (test) Third yo
| * 984e835 change
|/
* 97b44fe (HEAD -> base) Base commit
```

in this example I want to recursively rebase `test` onto `master`. Basically I want to _shift_ all the descendants of `test` with it when I rebase
basically make this my resulting tree

```* 078a33c (featB2) new line of foo
* 5e6d172 (featB) double
* ca8b071 yo -> foo
| * 798a72a (featA-b, featA) Fourth yo
|/
* 27751a8 (test) Third yo
* 984e835 change
|
* dd05107 (master) added a file
| * 5533678 (featD) feet!
|/
• 97b44fe (HEAD -> base) Base commit
```

(ofc with changed hashes)
since each of these rebases could fail, this command will first store the list and order of comamnds to execute in a storage file, and then it will pop the top one off the list, try and do it, if successfull it will continue on. If you run into conflicts or anything you can resolve them and then call `continue` on the recursive-rebase and it will continue from the stored list of commands
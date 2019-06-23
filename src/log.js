const construct = (obj, fn)=>Object.keys(obj).reduce((a, key)=>{const [k, v] = fn(obj[key], key);a[k] = v;return a;}, {});
const color = construct({
	black   : 30,
	red     : 91,
	green   : 32,
	yellow  : 33,
	blue    : 34,
	magenta : 35,
	cyan    : 36,
	white   : 37,
	gray    : 90,
}, (val, name)=>[name, (str)=>`\x1b[${val}m${str}\x1b[0m`]);



module.exports = {
	display : (cmds, effectedBranches)=>{
		console.log();
		console.log(color.yellow('effected branches:'));
		console.log(effectedBranches.map((branch)=>`  * ${color.cyan(branch.name)}`).join('\n'));
		console.log();
		console.log(color.yellow(`will execute the following commands:`));
		console.log(cmds.map((cmd)=>color.gray(`  ${cmd}`)).join('\n'));
		console.log();
	},

	error : (msg)=>{
		throw `${color.red('Can not replant:')} ${msg}`;
	},
	execute : (cmd)=>{
		console.log(color.gray('$'), color.white(cmd));
	},
	done : ()=>{
		console.log();
		console.log(color.green('🌱'), color.magenta('replant completed'), color.green('🌱'));
	},
	noop : ()=>{
		console.log('No replant in progress.');
	},
	conflict : (err)=>{
		console.log(err.toString());
		console.log(color.red('Issue with replant.'));
		console.log('Fix the conflicts, continue with the rebase then `git replant --continue`');
	},

	manpage : `
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
    --auto            adds '-Xtheirs' to rebases. When resolving conflicts will use subtree's changes.
    *                 all other options will be passed through to the internal rebase calls.

Actions:
    --continue        continue the replant
    --abort           aborts and returns git tree to original state
`,

};
const construct = (obj, fn)=>Object.keys(obj).reduce((a, key)=>{const [k, v] = fn(obj[key], key);a[k] = v;return a;}, {});
const color = construct({
	red     : 91,
	green   : 32,
	yellow  : 33,
	magenta : 35,
	cyan    : 36,
	white   : 37,
	gray    : 90,
}, (val, name)=>[name, (str)=>`\x1b[${val}m${str}\x1b[0m`]);


module.exports = {
	commands : (cmds, effectedBranches)=>{
		console.log();
		console.log(color.green('🌱'), color.cyan('git replant'), color.yellow(`will execute the following commands:`));
		console.log(cmds.map((cmd)=>color.gray(`  ${cmd}`)).join('\n'));
		console.log();
	},
	verbose : (tree, abortCmds)=>{
		console.log();
		console.log(color.magenta('Affected Git Tree:'));
		console.log(tree);
		console.log();
		console.log(color.red('Abort Commands:'));
		console.log(abortCmds.map((cmd)=>color.gray(`  ${cmd}`)).join('\n'));
	},

	error : (msg)=>{
		throw `${color.red('Can not replant:')} ${msg}`;
	},
	execute : (cmd)=>{
		console.log(color.gray('$'), color.white(cmd));
	},
	done : ()=>{
		console.log();
		console.log(color.green('🌱'), color.cyan('replant completed'), color.green('🌱'));
	},
	noop : ()=>{
		console.log('No replant in progress.');
	},
	conflict : (err)=>{
		console.log(color.red('Issue with replant.'));
		console.log(err.toString());
		console.log();
		console.log('Fix the conflicts, continue with the rebase then `git replant --continue`');
	},

	manpage : ()=>console.log(`
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
    -v, --version    display git replant version
    --verbose        displays the affected git tree and abort commands
    --dry-run        display what actions this command will take, but not execute them
    --auto           adds '-Xtheirs' to rebases. When resolving conflicts will use subtree's changes.
    *                all other options will be passed through to the internal rebase calls.

Actions:
    --continue       continue the replant
    --abort          aborts and returns git tree to original state
`),

};
const exec = require('./exec.js');
const log = require('./log.js');

const getCommitFromBranch = async (target)=>{
	return exec(`git rev-parse --short ${target}`);
};
const getParentBranch = async (target)=>{
	return exec(`git log ${target} --simplify-by-decoration --max-count=1 --skip=1 --pretty=%D`);
};

const getBranches = async (target)=>{
	let rootSha;
	return (await exec(`git branch --verbose --contains ${target}`)).split('\n')
		.map((line)=>{
			const [name, sha] = line.replace('* ', '').split(' ').filter((x)=>x).slice(0, 2);
			return { name, sha };
		});
};



const getAbortCommands = async (branches, base)=>{
	return [`git checkout ${base}`].concat(branches.map((branch)=>`git branch --force ${branch.name} ${branch.sha}`));
};

const getReplantCommands = async (target, base, opts = [])=>{
	const targetSHA = await getCommitFromBranch(target);
	const allChildren = await getBranches(target)
		.then((branches)=>branches.filter((branch)=>branch.sha !== targetSHA))
		.then((branches)=>{
			return Promise.all(branches.map(async ({ name, sha })=>{
				return { name, sha, parent : await getParentBranch(name) };
			}));
		});

	//NOTE: If two branches share the same SHA, we want to rebase one, and move the others.
	const siblingBranches = [];
	const filteredChildren = Object.values(allChildren.reduce((res, child)=>{
		if(res[child.sha])  siblingBranches.push([res[child.sha].name, child.name]);
		if(!res[child.sha]) res[child.sha] = child;
		return res;
	}, {}));

	const cmds = [];
	const nest = (name, sha)=>{
		const directChildren = allChildren.filter(({ parent })=>parent == name);
		directChildren.map((child)=>{
			cmds.push(`git checkout ${child.name} && git rebase ${opts.join(' ')} --onto ${name} ${sha}`);
			nest(child.name, child.sha);
		});
	};
	nest(target, targetSHA);
	return [].concat(
		`git checkout ${target} && git rebase ${opts.join(' ')} ${base}`,
		cmds,
		siblingBranches.map(([target, sibling])=>`git branch --force ${sibling} ${target}`)
	);
};

const getAffectedBranches = async (target, base)=>{
	await exec(`git rev-parse --verify ${target}`).catch(()=>log.error(`'${target}' does not exists.`));
	await exec(`git rev-parse --verify ${base}`).catch(()=>log.error(`'${base}' does not exists.`));

	return (await getBranches(target)).map((branch)=>{
		if(branch.name == base) log.error(`'${base}' is a descendant of '${target}'.`);
		return branch;
	});
};

module.exports = {
	getAffectedBranches,
	getReplantCommands,
	getAbortCommands,
};
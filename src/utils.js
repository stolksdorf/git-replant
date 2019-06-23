const exec = require('./exec.js');
const log = require('./log.js');

const getSHAFromBranch = async (target)=>{
	return exec(`git rev-parse --short ${target}`);
};
const getParentBranch = async (target)=>{
	return (await exec(`git log ${target} --simplify-by-decoration --max-count=1 --skip=1 --pretty=%D`))
		.replace('HEAD -> ', '');
};
const getChildBranches = async (name, sha)=>{
	if(!sha) sha = await getSHAFromBranch(name);
	return (await exec(`git branch --verbose --contains ${name}`))
		.split('\n')
		.map((line)=>{
			const [name, sha] = line.replace('* ', '').split(' ').filter((x)=>x).slice(0, 2);
			return { name, sha };
		})
		.filter((branch)=>branch.sha !== sha);
};

const getTree = async (target, base)=>{
	await exec(`git rev-parse --verify ${target}`).catch(()=>log.error(`'${target}' does not exists.`));
	await exec(`git rev-parse --verify ${base}`).catch(()=>log.error(`'${base}' does not exists.`));

	const targetSHA = await getSHAFromBranch(target);
	const children = await getChildBranches(target, targetSHA);

	children.map((branch)=>{ if(branch.name == base) log.error(`'${base}' is a descendant of '${target}'.`); });

	//Adds parent to branch, if it has a sibling, adds sibling name instead
	const _temp = {};
	const branches = await Promise.all(children.map(async (branch)=>{
		if(_temp[branch.sha]) return { ...branch, sibling : _temp[branch.sha].name };
		_temp[branch.sha] = branch;
		return { ...branch, parent : await getParentBranch(branch.name) };
	}));

	return {
		target : {
			name : target,
			sha  : targetSHA,
		},
		base,
		branches,
	};
};

const getReplantCommands = async ({ target, base, branches }, opts = [])=>{
	const optsString = opts.length ? `${opts.join(' ')} ` : '';
	const rebaseCmds = [];
	const walk = (name, sha)=>{
		branches
			.filter((br)=>br.parent == name)
			.map((child)=>{
				rebaseCmds.push(`git checkout ${child.name} && git rebase ${optsString}--onto ${name} ${sha}`);
				walk(child.name, child.sha);
			});
	};
	walk(target.name, target.sha);

	const moveCmds = branches
		.filter((br)=>br.sibling)
		.map((br)=>`git branch --force ${br.name} ${br.sibling}`);

	return [].concat(
		`git checkout ${target.name} && git rebase ${optsString}${base}`,
		rebaseCmds,
		moveCmds,
		`git checkout ${target.name}`
	);
};

const getAbortCommands = ({ target, base, branches })=>{
	return [`git checkout ${base}`]
		.concat(`git branch --force ${target.name} ${target.sha}`)
		.concat(branches.map((branch)=>`git branch --force ${branch.name} ${branch.sha}`));
};

module.exports = {
	getTree,
	getReplantCommands,
	getAbortCommands,
};
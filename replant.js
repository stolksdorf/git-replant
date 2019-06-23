const exec = require('./exec.js')
const progressFile = require('./progress.file.js');
const log = require('./log.js')


const getCommitFromBranch = async (target)=>{
	return exec(`git rev-parse --short ${target}`)
}
const getParentBranch = async (target)=>{
	return exec(`git log ${target} --simplify-by-decoration --max-count=1 --skip=1 --pretty=%D`);
}
const childBranches = async (target)=>{
	return exec(`git branch --verbose --contains ${target}`)
		.then((res)=>{
			let rootSha;
			return res.split('\n')
				.map((line)=>{
					const [name, sha] = line.split(' ').filter(x=>x).slice(0,2);
					if(name == target) rootSha = sha;
					return {name, sha}
				})
				.filter(({name, sha})=>sha!=rootSha)
		})
};

const getReplantCommands = async (target, base, opts=[])=>{
	const targetSHA = await getCommitFromBranch(target);
	const allChildren = await childBranches(target)
		.then((branches)=>{
			return Promise.all(branches.map(async ({name, sha})=>{
				return { name, sha, parent : await getParentBranch(name)};
			}));
		});

	//NOTE: If two branches share the same SHA, we want to rebase one, and move the others.
	let siblingBranches = [];
	const filteredChildren = Object.values(allChildren.reduce((res, child)=>{
		if(res[child.sha])  siblingBranches.push([res[child.sha].name, child.name]);
		if(!res[child.sha]) res[child.sha] = child;
		return res;
	}, {}))

	let cmds = [];
	const nest = (name, sha)=>{
		const directChildren = allChildren.filter(({parent})=>parent==name);
		directChildren.map((child)=>{
			cmds.push(`git checkout ${child.name} && git rebase ${opts.join(' ')} --onto ${name} ${sha}`);
			nest(child.name, child.sha);
		});
	}
	nest(target, targetSHA);
	return [].concat(
		`git checkout ${target} && git rebase ${opts.join(' ')} ${base}`,
		cmds,
		siblingBranches.map(([target, sibling])=>`git branch --force ${sibling} ${target}`)
	);
};

const validate = async (target, base)=>{
	await exec(`git rev-parse --verify ${target}`).catch(()=>log.error(`'${target}' does not exists.`));
	await exec(`git rev-parse --verify ${base}`).catch(()=>log.error(`'${base}' does not exists.`));

	//NOTE: base can not be a child of target
	return [target].concat((await childBranches(target)).map((branch)=>{
		if(branch.name == base) log.error(`'${base}' is a descendant of '${target}'.`);
		return branch.name;
	}));
};

const run = async (target, base, passthroughOpts=[], isDryRun)=>{
	const affectedBranches = await validate(target, base);
	const cmds = await getReplantCommands(target, base, passthroughOpts);
	log.display(cmds, affectedBranches);

	if(isDryRun) return;

	await progressFile.update(cmds);
	return continueReplant();
}

const continueReplant = async ()=>{
	const cmds = await progressFile.get();
	if(!cmds) return await progressFile.remove();
	const [cmd, ...rest] = cmds;
	if(!cmd){
		log.done();
		return await progressFile.remove();
	}
	await progressFile.update(rest);

	log.execute(cmd);
	return exec(cmd).then(()=>continueReplant());
}

const abort = async ()=>{
	return progressFile.remove();
}

module.exports = {
	run,
	continueReplant,
	abort
}
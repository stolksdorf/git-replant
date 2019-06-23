const exec = require('./exec.js')
const log = require('./log.js');
const utils = require('./utils.js');

const sequence = async (obj, fn)=>Object.keys(obj).reduce((a,key)=>a.then((r)=>fn(obj[key], key, r)), Promise.resolve());

const progressFile = require('./git.file.js')('replant_progress');
const abortFile = require('./git.file.js')('replant_abort');


const cleanup = async ()=>{
	await abortFile.remove();
	await progressFile.remove();
	return log.done();
}

const iterate = async ()=>{
	const cmds = await progressFile.get();
	if(!cmds) return await cleanup();
	const [cmd, ...rest] = cmds;
	if(!cmd) return await cleanup();

	await progressFile.update(rest);

	log.execute(cmd);
	//iterate();
	return exec(cmd)
		.then(()=>iterate())
		.catch((err)=>log.conflict())
};

const run = async (target, base, passthroughOpts=[], isDryRun)=>{
	const affectedBranches = await utils.getAffectedBranches(target, base);
	const cmds = await utils.getReplantCommands(target, base, passthroughOpts);
	log.display(cmds, affectedBranches);

	if(isDryRun) return;

	await progressFile.update(cmds);
	const abortCmds = await utils.getAbortCommands(affectedBranches, base);
	await abortFile.update(abortCmds);
	return iterate();
}

const continueReplant = async ()=>{
	if(!await progressFile.exists()) return log.noop();
	return iterate();
}

const abort = async ()=>{
	const cmds = await abortFile.get();
	if(!cmds) return log.noop();

	await exec('git rebase --abort').catch(()=>{});
	await sequence(cmds, (cmd)=>{
		log.execute(cmd);
		return exec(cmd);
	})
	await abortFile.remove();
	await progressFile.remove();
}

module.exports = {
	run,
	continueReplant,
	abort
}
const exec = require('./exec.js');
const log = require('./log.js');
const utils = require('./utils.js');

const sequence = async (obj, fn)=>Object.keys(obj).reduce((a, key)=>a.then((r)=>fn(obj[key], key, r)), Promise.resolve());

const progressFile = require('./git.file.js')('replant_progress');
const abortFile = require('./git.file.js')('replant_abort');


const cleanup = async ()=>{
	await abortFile.remove();
	await progressFile.remove();
	return log.done();
};

const iterate = async ()=>{
	const replantCmds = await progressFile.get();
	if(!replantCmds) return await cleanup();
	const [cmd, ...rest] = replantCmds;
	if(!cmd) return await cleanup();

	await progressFile.update(rest);

	log.execute(cmd);
	return exec(cmd)
		.then(()=>iterate())
		.catch((err)=>log.conflict(err));
};


const run = async (target, base, passthroughOpts = [], isDryRun)=>{
	const Tree = await utils.getTree(target, base);

	const replantCmds = await utils.getReplantCommands(Tree, passthroughOpts);
	const abortCmds = utils.getAbortCommands(Tree);

	log.commands(replantCmds);

	if(isDryRun) return;

	await progressFile.update(replantCmds);
	await abortFile.update(abortCmds);
	return iterate();
};

const continueReplant = async ()=>{
	if(!await progressFile.exists()) return log.noop();
	return iterate();
};

const abort = async ()=>{
	const abortCmds = await abortFile.get();
	if(!abortCmds) return log.noop();

	await exec('git rebase --abort').catch(()=>{});
	await sequence(abortCmds, (cmd)=>{
		log.execute(cmd);
		return exec(cmd);
	});
	await abortFile.remove();
	await progressFile.remove();
};

module.exports = {
	run,
	continueReplant,
	abort,
};
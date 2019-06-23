const promisify = require('util').promisify;
const fs = require('fs');
const path = require('path');
const exec = require('./exec.js');

/***
Manages a replant-progress file within the repo's .git directory
That file tracks which commands still need to be done if the replant
gets interupted
***/


const getProgressFilePath = async ()=>{
	return exec(`git rev-parse --show-toplevel`)
		.then((repoPath)=>path.join(repoPath, '.git', 'replant-inprogress'));
}

const progressFileExists = async (loc=false)=>{
	if(!loc) loc = await getProgressFilePath();
	return await promisify(fs.access)(loc).then(()=>true).catch(()=>false);
}

const removeProgressFile = async ()=>{
	const loc = await getProgressFilePath();
	const exists = await progressFileExists(loc);
	if(exists === false) return console.log(`No replant in progress.`);
	return promisify(fs.unlink)(loc);
}

const updateProgressFile = async (cmds)=>{
	return promisify(fs.writeFile)(
		await getProgressFilePath(),
		cmds.join('\n'),
		'utf8'
	);
};

const getProgressFile = async ()=>{
	const loc = await getProgressFilePath();
	const exists = await progressFileExists(loc);
	if(await progressFileExists(loc) === false) return false;
	return await promisify(fs.readFile)(loc, 'utf8').then(x=>x.split('\n'));
}

module.exports = {
	remove : removeProgressFile,
	update : updateProgressFile,
	get    : getProgressFile,
	exists : progressFileExists
}
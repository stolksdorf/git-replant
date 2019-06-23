const promisify = require('util').promisify;
const fs = require('fs');
const path = require('path');
const exec = require('./exec.js');

/***
Manages temporary git files within the repo's .git directory
USed for tracking progress and what to do to abort
***/


const getFilePath = async (name)=>{
	return exec(`git rev-parse --show-toplevel`)
		.then((repoPath)=>path.join(repoPath, '.git', name));
};

const fileExists = async (fp)=>{
	return await promisify(fs.access)(fp).then(()=>true).catch(()=>false);
};

const removeFile = async (fp)=>{
	if(await fileExists(fp) === false) return console.log(`No replant in progress.`);
	return promisify(fs.unlink)(fp);
};

const updateFile = async (fp, cmds)=>{
	return promisify(fs.writeFile)(fp, cmds.join('\n'), 'utf8');
};

const getFile = async (fp)=>{
	if(await fileExists(fp) === false) return false;
	return await promisify(fs.readFile)(fp, 'utf8').then((x)=>x.split('\n'));
};


module.exports = (name)=>{
	let fp;
	const get = async ()=>{
		if(!fp) fp = await getFilePath(name);
		return fp;
	};
	return {
		remove : async ()=>removeFile(await get()),
		update : async (cmds)=>updateFile(await get(), cmds),
		get    : async ()=>getFile(await get()),
		exists : async ()=>fileExists(await get()),
	};
};
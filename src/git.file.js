const promisify = require('util').promisify;
const fs = require('fs');
const path = require('path');
const exec = require('./exec.js');

/***
Manages a replant-progress file within the repo's .git directory
That file tracks which commands still need to be done if the replant
gets interupted
***/


const getFilePath = async (name)=>{
	return exec(`git rev-parse --show-toplevel`)
		.then((repoPath)=>path.join(repoPath, '.git', name));
}

const fileExists = async (name)=>{
	const fp = await getFilePath(name);
	return await promisify(fs.access)(fp).then(()=>true).catch(()=>false);
}

const removeFile = async (name)=>{
	const fp = await getFilePath(name);
	if(await fileExists(name) === false) return console.log(`No replant in progress.`);
	return promisify(fs.unlink)(fp);
}

const updateFile = async (name, cmds)=>{
	const fp = await getFilePath(name);
	return promisify(fs.writeFile)(fp, cmds.join('\n'), 'utf8');
};

const getFile = async (name)=>{
	const fp = await getFilePath(name);
	if(await fileExists(name) === false) return false;
	return await promisify(fs.readFile)(fp, 'utf8').then(x=>x.split('\n'));
}

module.exports = (name)=>{
	return {
		remove : removeFile.bind(null, name),
		update : updateFile.bind(null, name),
		get    : getFile.bind(null, name),
		exists : fileExists.bind(null, name),
	}
}
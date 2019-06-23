const exec = require('child_process').exec;

module.exports = async (cmd)=>{
	return new Promise((resolve, reject)=>{
		exec(cmd, (err, stdout, stderr)=>{
			if(err != null) return reject(new Error(err));
			if(typeof(stderr) != 'string') return reject(new Error(stderr));
			return resolve(stdout.trim());
		});
	});
};
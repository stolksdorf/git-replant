#!/usr/bin/env node

(async function(){
	const replant = require('./replant.js');
	const passthrough = [];

	const args = require('./minimist.js')(process.argv.slice(2), {
		boolean : ['continue', 'dry-run', 'abort', 'help', 'version', 'auto', 'verbose'],
		alias   : {
			h : 'help',
			v : 'version',
		},
		unknown : (arg)=>{
			if(arg[0] != '-') return true;
			passthrough.push(arg);
			return false;
		},
	});

	if(args.help)    return require('./log.js').manpage();
	if(args.version) return console.log(`v${require('../package.json').version}`);

	if(args['continue']) return replant.continueReplant();
	if(args['abort']) return replant.abort();

	if(args['auto']) passthrough.push('-Xtheirs');

	const [target, newRoot] = args._;
	if(!target || !newRoot) throw `Replant requires two arguments: a target branch and a new root branch`;

	return replant.run(target, newRoot, passthrough, args);

})().catch((err)=>console.log(err));

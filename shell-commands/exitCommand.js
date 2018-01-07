require('mootools');
const baseCommand = require('../lib/commandApi');

let command = new Class({
	Extends: baseCommand,
	
	trigger: 'exit',
	
	fn: function(resources, params, resolve, reject) {
		resources.shell.rl.question("Confirm exit : ", function(answer) {
			return (answer.match(/^y(es)?$/i)) ? process.exit(1) : reject('No confirmation.');
		});
	},
});

module.exports = command;

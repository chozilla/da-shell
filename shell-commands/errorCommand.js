const color = require('chalk');
const baseCommand = require('../lib/commandApi');

let command = new Class({
	Extends: baseCommand,
	
	trigger: 'error',
	
	fn: function(resources, params, resolve, reject) {
		console.log(color.blue(resources.shell.errorCount + ' Errors on record (max.'+resources.shell.settings.errorHistory+')'));
		
		if(params[0] && params[0] !== 'last') {
			let index = parseInt(params[0]);
			if(resources.shell.errors[index]) {
				return resolve(['Showing error #'+index +': ', color.red(JSON.stringify(resources.shell.errors[index]))]);
			} else {
				return reject('Error '+ color.red(params[0]) +' not found');
			}
		}
		
		if(resources.shell.errorLast) {
			return resolve(['Showing last error: ', color.red(JSON.stringify(resources.shell.errorLast))]);
		} else {
			return resolve('No previous errors found.');
		}
	},
});

module.exports = command;

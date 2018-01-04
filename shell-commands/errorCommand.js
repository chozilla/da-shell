require('mootools');
const color = require('chalk');
const baseCommand = require('../lib/commandApi');

let command = new Class({
	Extends: baseCommand,
	
	trigger: 'error',
	
	fn: function(shell, params, resolve, reject) {
		console.log(color.blue(shell.errorCount + ' Errors on record (max.'+shell.settings.errorHistory+')'));
		
		if(params[0] && params[0] !== 'last') {
			let index = parseInt(params[0]);
			if(shell.errors[index]) {
				return resolve(['Showing error #'+index +': ', color.red(JSON.stringify(shell.errors[index]))]);
			} else {
				return reject('Error '+ color.red(params[0]) +' not found');
			}
		}
		
		if(shell.errorLast) {
			return resolve(['Showing last error: ', color.red(JSON.stringify(shell.errorLast))]);
		} else {
			return resolve('No previous errors found.');
		}
	},
});

module.exports = command;

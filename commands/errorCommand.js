const color = require('chalk');
const baseCommand = require('../da-shell-command-base-class');

module.exports = class errorCommand extends baseCommand {
	trigger = 'error';
	fn(resources, params, resolve, reject) {
		console.log(color.blue(resources.shell.errors.length + ' Errors on record (max.'+resources.shell.settings.errorHistory+')'));

		let index = 0;

		if (params[0] && params[0] !== 'last') {
			let index = parseInt(params[0]);
		} else {
			index = resources.shell.errors.length -1;
		}

		if (resources.shell.errors[index]) {
			return resolve(['Showing error (#'+(index+1)+'/'+resources.shell.errors.length+') : ', color.red(JSON.stringify(resources.shell.errors[index]))]);
		} else {
			if (index === 0) {
				return resolve('No previous errors found.');
			} else {
				return reject('Error '+ color.red(params[0]) +' not found');
			}

		}
	}
};

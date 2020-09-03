const baseCommand = require('../da-shell-command-base-class');

module.exports = class exitCommand extends baseCommand {
	trigger = 'exit';

	fn(resources, params, resolve, reject) {
		resources.shell.readline.question("Confirm exit : ", function(answer) {
			return (answer.match(/^y(es)?$/i)) ? process.exit(1) : reject('No confirmation.');
		});
	}
};

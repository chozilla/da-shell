const color = require('chalk');

module.exports = class commandBaseClass {
	active = false;
	trigger = 'help';
	
	constructor(resources) {}
	
	exec(resources, params) {
		return new Promise((resolve, reject) => {
			this.fn(resources, params, resolve, reject);
			
		}).then((response) => {
			
			if(response.join) {
				console.log(
					color.gray('shell') +
					color.red(' => Command ') +
					color.yellow(this.trigger.trim()) +
					color.red(' executed:'),
					response.join(' ')
				);
			} else {
				console.log(
					color.gray('shell') +
					color.red(' => Command ') +
					color.yellow(this.trigger.trim()) +
					color.red(' executed:'),
					response
				);
			}
			
			
			//compleations cleanup;
			resources.shell.completions = [];
		}).catch((reason) => {
			console.log(
				color.gray('shell') +
				color.red(' => Command ') +
				color.yellow(this.trigger.trim()) +
				color.red(' refused:'),
				reason
			);
		});
	}
	
	fn(resources, params, resolve, reject) {
		
	}
	
}

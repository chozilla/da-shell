require('mootools');
const color = require('chalk');

module.exports = new Class({
	active: false,
	trigger: 'help',
	
	initialize: function(resources) {
		
	},
	
	exec: function(shell, params) {
		return new Promise((resolve, reject) => {
			this.fn(shell, params, resolve, reject);
			
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
			shell.completions = [];
		}).catch((reason) => {
			console.log(
				color.gray('shell') +
				color.red(' => Command ') +
				color.yellow(this.trigger.trim()) +
				color.red(' refused:'),
				reason
			);
		});
	},
	
	fn: function(shell, params, resolve, reject) {
		
	}
	
});

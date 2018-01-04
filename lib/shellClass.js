require('mootools');
const color = require('chalk');
const readline = require('readline');
const util = require('util');
const fs = require('fs');

function time(format = 'short') {
	let d = new Date().toISOString().split('.')[0].split('T');
	switch(format) {
		case 'long':
			return d[1] + ' ' + d[0];
		default:
			return d[1];
	}
}

module.exports = new Class({
	rl: null,
	commands: [],
	completions: [],
	shutdownCalls: [],
	settings: null,
	errors: [],
	errorCount: 0,
	errorLast: null,
	
	initialize: function(resources, console, settings, commandPath) {
		let shell = resources.shell = this;
		this.settings = settings;
		
		//load build in commands
		fs.readdirSync(__dirname + '/../shell-commands/').forEach((file) => {
			let path = commandPath + '/' + file;
			if (fs.statSync(path).isFile() && path.lastIndexOf('.js') === (path.length - '.js'.length)) {
				let command = require(path);
				this.addCommand(new command(resources));
			}
		});
		
		//load project commands
		fs.readdirSync(commandPath).forEach((file) => {
			let path = commandPath + '/' + file;
			if (fs.statSync(path).isFile() && path.lastIndexOf('.js') === (path.length - '.js'.length)) {
				let command = require(path);
				this.addCommand(new command(resources));
			}
		});
		
		console.log('>> Console: ' + "\t\t" + color.green('ready'));
		
		console.log = function() {
			shell.fu("log", arguments);
		};
		console.warn = function() {
			shell.fu("warn", arguments);
		};
		console.info = function() {
			shell.fu("info", arguments);
		};
		console.error = function() {
			shell.errorCount++;
			shell.errorLast = arguments;
			if(shell.errors.length < shell.settings.errorHistory) {
				//fixme: log the last messages and not the first.
				shell.errors.push(arguments);
			}
			shell.fu("error", arguments);
		};
		
		let completer = (line) => {
			let completions = [];
			if(shell.completions.length > 0) {
				shell.completions.each((tmp)=> {
					if(tmp.toLowerCase().indexOf(line.toLowerCase()) === 0) {
						completions.push(tmp);
					}
				});
			} else {
				shell.commands.each((cmd) => {
					if(cmd.trigger.toLowerCase().indexOf(line.toLowerCase()) === 0) {
						completions.push(cmd.trigger);
					}
				});
			}
			
			if(completions.length <= 1) {
				return [completions, line];
			} else {
				let options = [];
				let command = completions[0];
				let length;
				completions.map((c) => {
					options.push(color.blue(c.trim()));
					length = 1;
					while(command.indexOf(c.substr(0,length)) !== -1 && length < c.length) {
						length++;
					}
					command = c.substr(0, length-1);
				});
				console.log(color.gray('Options: ') + options.join(', '));
				
				return [[command], line];
			}
		};
		
		let rl = this.rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
			completer: completer
		});
		
		this.refresh();
		
		rl.on("line",(line) => {
			let params = line.trim().split(" ");
			let trigger = params.shift();
			
			let command = null;
			this.commands.each((c) => {
				if(c.trigger.trim() === trigger) {
					command = c;
				}
			});
			if(command === null) {
				console.log(color.gray('shell')+color.red(' => Command "')+ trigger +color.red('" not found.'));
				rl.prompt();
			} else {
				command.exec(this, params).then(() => {
					rl.prompt();
				});
			}
		});
		
		rl.on('close', function() {
			return shell.shutdown().then(() => {
				console.log('Shutdown => complete');
				rl.clearLine();
				return process.exit(1);
			});
		});
		
		rl.on("SIGINT", function() {
			return shell.shutdown().then(() => {
				console.log('Shutdown => complete');
				rl.clearLine();
				return process.exit(1);
			});
		});
		
		console.log('>> Prompt: '+ "\t\t" + color.green('ready'));
		rl.prompt();
	},
	
	refresh: function() {
		let prompt = this.settings.prompt.substitute(this.settings.promptParams) + "> ";
		
		if(color[this.settings.promptColor]) {
			this.rl.setPrompt(color[this.settings.promptColor](prompt), 2);
		} else {
			this.rl.setPrompt(color.red(prompt), 2);
		}
	},
	
	shutdown: function() {
		let shutdown = [];
		this.shutdownCalls.each((c) => {
			shutdown.push(c());
		});
		return Promise.all(shutdown);
	},
	
	registerShutdown: function(promise) {
		this.shutdownCalls.push(promise);
	},
	
	addCommand: function(command) {
		this.commands.push(command);
	},
	
	fu: function(type, args) {
		let t = Math.ceil((this.rl.line.length + 3) / process.stdout.columns);
		let text = util.format.apply(console, args);
		switch(type) {
			case 'info':
				if(this.settings.logLevel > 0) {
					this.rl.output.write("\n\x1B[" + t + "A\x1B[0J");
					this.rl.output.write(time() + color.blue('(i)') + ': ' + text + "\n");
					this.rl.output.write([t].join("\n\x1B[E"));
					this.rl._refreshLine();
				}
				break;
			case 'warn':
				this.rl.output.write("\n\x1B[" + t + "A\x1B[0J");
				this.rl.output.write(time() + color.yellow('(w)') + ': ' + text + "\n");
				this.rl.output.write([t].join("\n\x1B[E"));
				this.rl._refreshLine();
				break;
			case 'error':
				this.rl.output.write("\n\x1B[" + t + "A\x1B[0J");
				this.rl.output.write(time() + color.red('(e)') + ': ' + text + "\n");
				this.rl.output.write([t].join("\n\x1B[E"));
				this.rl._refreshLine();
				break;
			default:
				this.rl.output.write("\n\x1B[" + t + "A\x1B[0J");
				this.rl.output.write(text + "\n");
				this.rl.output.write([t].join("\n\x1B[E"));
				this.rl._refreshLine();
				break;
		}
	},
	
});



require('mootools');

const color = require('chalk');
const shellConfig = require('./config/config.bs-shell.json');
const shellClass = require('./lib/shellClass');

process.stdout.write("\x1Bc");

let resources = {
	shell: null,
	console: console,
};

resources.prompt = new shellClass(resources, console, shellConfig, __dirname + '/' + shellConfig.commandPath);

let test = setInterval(function() {
	console.log(color.gray('Some Text '+ Math.random()));
}, 2000);

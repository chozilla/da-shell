require('mootools-server');

const color = require('chalk');
const shellConfig = require('./config/config.bs-shell.json');
const shellClass = require('./lib/shellClass');

process.stdout.write("\x1Bc");

let resources = {
	shell: null,
	console: console,
};

let prompt = resources.prompt = new shellClass(resources, console, shellConfig, __dirname + '/' + shellConfig.commandPath);

let _default = 0;
let _answers = [0,1,2,3,4,5,6,7,8,9];
prompt.question('Enter an number between 0 and 9', (answer) => {
	let test = parseInt(answer,10);
	if(test >= 0 && test <= 9) {
		return test;
	} else {
		return null;
	}
}, _answers).then((number) => {
	console.info('you have chosen', number);
	
	prompt.question('Enter a new number between '+number+' and '+(number+20), (answer) => {
		let test = parseInt(answer,10);
		if(test >= number && test < number+20) {
			return test;
		} else {
			return null;
		}
	}, _answers, _default).then((number) => {
		console.info('you have chosen', number);
	});
}).catch(() => {
	process.exit(1);
});

setInterval(function() {
	console.log(color.gray('Some Text '+ Math.random()));
}, 2000);

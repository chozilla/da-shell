const color = require('chalk');
const readline = require('readline');
const util = require('util');
const fs = require('fs');
const formatTime = require('./util/format-time.js');

require('./util/promise-finally.js');
const substituteString = require('./util/string-substitute.js');


module.exports = class daShell {
    commands = [];
    completions = [];
    shutdownCalls = [];
    params = {};
    errors = [];
    errorCount = 0;
    errorLast = undefined;
    onKeyPress = undefined;

    constructor(resources, settings, commandPath= undefined) {

        resources.shell = this;

        this.resources = resources;
        this.settings = settings;
        this.params = settings.promptParams;

        this.readline = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            completer: this._getCompleter(),
        });

        process.stdout.write("\x1Bc");
        this.__initConsole();
        this.__initCommands(commandPath);
        this.__initShell();
    }

    __initConsole() {
        const rl = this.readline;
        const shell = this;
        const fu = (type, args) => {
            let t = Math.ceil((rl.line.length + 3) / process.stdout.columns);
            let text = util.format.apply(console, args);
            switch (type) {
                case 'info':
                    if (this.settings.logLevel < 0) {
                        break;
                    }
                    rl.output.write("\n\x1B[" + t + "A\x1B[0J");
                    rl.output.write(formatTime() + color.blue('(i)') + ': ' + text + "\n");
                    rl.output.write([t].join("\n\x1B[E"));
                    rl._refreshLine();
                    break;
                case 'warn':
                    rl.output.write("\n\x1B[" + t + "A\x1B[0J");
                    rl.output.write(formatTime() + color.yellow('(w)') + ': ' + text + "\n");
                    rl.output.write([t].join("\n\x1B[E"));
                    rl._refreshLine();
                    break;
                case 'error':
                    rl.output.write("\n\x1B[" + t + "A\x1B[0J");
                    rl.output.write(formatTime() + color.red('(e)') + ': ' + text + "\n");
                    rl.output.write([t].join("\n\x1B[E"));
                    rl._refreshLine();
                    break;
                default:
                    rl.output.write("\n\x1B[" + t + "A\x1B[0J");
                    rl.output.write(text + "\n");
                    rl.output.write([t].join("\n\x1B[E"));
                    rl._refreshLine();
                    break;
            }
        }

        console.log('>> Console: ' + "\t\t" + color.green('ready'));
        console.log = function () {
            fu("log", arguments);
        };
        console.warn = function () {
            fu("warn", arguments);
        };
        console.info = function () {
            fu("info", arguments);
        };
        console.error = function () {
            shell.errorCount++;
            shell.errorLast = arguments;
            shell.errors.push(arguments);
            if (shell.errors.length > shell.settings.errorHistory) {
                shell.errors = shell.errors.slice((shell.settings.errorHistory || 50) * -1);
            }
            fu("error", arguments);
        };
    }

    __initCommands(commandPath) {
        //load build in commands
        fs.readdirSync(__dirname + '/commands/').forEach((file) => {
            let path = __dirname + '/commands/' + '/' + file;
            if (fs.statSync(path).isFile() && path.lastIndexOf('.js') === (path.length - '.js'.length)) {
                let command = require(path);
                this.commands.push(new command(this.resources));
            }
        });

        if (commandPath) {
            console.log(commandPath);
            //load project commands
            fs.readdirSync(commandPath).forEach((file) => {
                let path = commandPath + '/' + file;
                if (fs.statSync(path).isFile() && path.lastIndexOf('.js') === (path.length - '.js'.length)) {
                    let command = require(path);
                    this.commands.push(new command(this.resources));
                }
            });
        }
    }

    __initShell() {
        const rl = this.readline;
        process.stdin.on('keypress', (str, key) => {
            if (typeof this.onKeyPress === "function") {
                this.onKeyPress(key, str);
            }
        });
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
        }
        readline.emitKeypressEvents(process.stdin, rl);
        this.reset();

        rl.on("line", (line) => {
            if (this.onKeyPress) return;

            let params = line.trim().split(" ");
            let trigger = params.shift();

            let command = null;
            this.commands.forEach((c) => {
                if (c.trigger.trim() === trigger) {
                    command = c;
                }
            });
            if (command === null) {
                console.log(color.gray('shell') + color.red(' => Command "') + trigger + color.red('" not found.'));
                rl.prompt();
            } else {
                command.exec(this.resources, params).then(() => {
                    rl.prompt();
                });
            }
        });

        rl.on('close', () => {
            return this.shutdown().then(() => {
                console.log('Shutdown => complete');
                rl.clearLine();
                return process.exit(1);
            });
        });

        rl.on("SIGINT", () => {
            return this.shutdown().then(() => {
                console.log('Shutdown => complete');
                rl.clearLine();
                return process.exit(1);
            });
        });

        console.log('>> Prompt: ' + "\t\t" + color.green('ready'));
        rl.prompt();
    }

    _getCompleter() {
        return (line) => {
            let completions = [];
            if (this.completions.length > 0) {
                this.completions.forEach((tmp) => {
                    tmp = tmp.toString();
                    if (tmp.toLowerCase().indexOf(line.toLowerCase()) === 0) {
                        completions.push(tmp);
                    }
                });
            } else {
                this.commands.forEach((cmd) => {
                    if (cmd.trigger.toLowerCase().indexOf(line.toLowerCase()) === 0) {
                        completions.push(cmd.trigger);
                    }
                });
            }

            if (completions.length <= 1) {
                return [completions, line];
            } else {
                let options = [];
                let command = completions[0];
                let length;
                completions.map((c) => {
                    options.push(color.blue(c.trim()));
                    length = 1;
                    while (command.indexOf(c.substr(0, length)) !== -1 && length < c.length) {
                        length++;
                    }
                    command = c.substr(0, length - 1);
                });
                console.log(color.gray('Options: ') + options.join(', '));

                return [[command], line];
            }
        }
    };

    reset() {
        this.completions = [];
        this.onKeyPress = null;

        let prompt = substituteString(this.settings.prompt, this.params) + "> ";

        if (color[this.settings.promptColor]) {
            this.readline.setPrompt(color[this.settings.promptColor](prompt), 2);
        } else {
            this.readline.setPrompt(color.red(prompt), 2);
        }
    }

    shutdown () {
        return Promise.all(this.shutdownCalls);
    }

    registerShutdown (promise) {
        this.shutdownCalls.push(promise);
    }

    addCommand (command) {
        this.commands.push(command);
    }

    removeCommand (command) {
        this.commands.erase(command);
    }

    question (questionString, check, answers = [''], fallback = undefined) {
        this.completions = answers;
        console.log(answers);
        return new Promise((resolve) => {
            let question = color.red(questionString);
            if (fallback !== undefined) {
                question += color.green(' (default: ' + fallback + ')');
            }
            question += color.red(': ');
            let what = (input) => {
                let answer = check(input);
                if (answer !== null) {
                    console.log('answer accepted:', answer);
                    resolve(answer);
                } else if (fallback !== undefined) {
                    console.log('answer invalid:', input, 'choosen fallback:', fallback);
                    resolve(fallback)
                } else {
                    console.log('answer invalid:', input)
                    this.readline.question(question, what);
                }
            };
            this.readline.question(question, what);
        }).finally(() => {
            this.reset();
        });
    }

    interactive (promptString, api, previous = []) {
        this.readline.setPrompt(promptString);
        this.completions = [''];

        return new Promise((resolve, reject) => {
            this.onKeyPress = (meta, key) => {
                this.readline.write('\b');
                readline.clearLine(process.stdout, -1);
                this.readline.write('\r');
                if (key === 'e') {
                    resolve(key);
                }
                if (api[key]) {
                    let result = api[key](previous);
                    if (result) {
                        //stay
                    } else {
                        reject(key);
                    }
                }
            };
        }).finally(() => {
            this.reset();
        });
    }
}



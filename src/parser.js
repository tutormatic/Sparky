const fs = require("fs");
const chalk = require("chalk");
const prompt = require('prompt-sync')();
const { spawn, exec } = require('child_process');
const { app, BrowserWindow } = require('electron');
const lex = require("./lexer");
const { isString, remString } = require("./functions");
const path = require("path");

fs.readdir("./Code", "utf-8", function(err, files) {
    if (process.argv[2].endsWith(".spk")) {
        code = fs.readFileSync(process.argv[2], "utf-8");
    } else {
        console.log("You can't load a file that isn't a .spk.")
    }


    let token = lex(code);

    let variable = {};
    for (let i = 0; i < token.length; i++) {

        // Libs
        fs.readdir(__dirname.slice(0, -3) + "lib", "utf-8", function(err, file) {
            file.forEach(function(files) {
                const lib = fs.readFileSync(__dirname.slice(0, -3) + `lib/${files}`, "utf-8");
                eval(lib);
            });
        });

        if (token[i][0] === "set") {
            if (token[i][1] !== "") {
                if (token[i][2] === "=") {
                    if (token[i][3] !== "") {
                        var concatenatedValue = "";
        
                        for (var j = 3; j < token[i].length; j++) {
                            if (typeof token[i][j] === 'string') {
                                if (typeof token[i][j] === 'string' && token[i][j] !== "..") {
                                    concatenatedValue += token[i][j].remString();
                                } else if (typeof token[i][j] === 'string' && variable[token[i][j]] !== undefined) {
                                    concatenatedValue += variable[token[i][j]];
                                } else if (token[i][j] === "..") {
                                    continue;
                                }
                            }
                        }
        
                        if (concatenatedValue.match(/\d+\s*\/\s*\d+/g)) { // Checking if contains mathematical fractions
                            variable[token[i][1]] = eval(concatenatedValue);
                        } else {
                            variable[token[i][1]] = concatenatedValue;
                        }
                    }
                }
            }
        }

        if (token[i][0] === "print") {
            if (token[i][1].isString()) {
                console.log(token[i][1].remString());
            } else if (token[i][1].isNumber()) {
                console.log(Number(token[i][1]));
            } else if (token[i][1].isVariable()) {
                console.log(variable[token[i][1]]);
            }
        }
        
        if (token[i][0] === "print:single") {
            if (token[i][1].isString()) {
                process.stdout.write(token[i][1].remString());
            } else if (token[i][1].isNumber()) {
                process.stdout.write(Number(token[i][1]));
            } else if (token[i][1].isVariable()) {
                process.stdout.write(variable[token[i][1]]);
            }
        }

        if (token[i][0] === "print:color") {
            if (token[i][1].isString()) {
                if (token[i][2].isVariable()) {
                    eval(`console.log(chalk.${variable[token[i][2]]}(token[i][1].remString()))`);
                } else {
                    eval(`console.log(chalk.${token[i][2].remString()}(token[i][1].remString()))`);
                }
            } else if (token[i][1].isNumber()) {
                if (token[i][2].isVariable()) {
                    eval(`console.log(chalk.${variable[token[i][2]]}(Number(token[i][1])))`);
                } else {
                    eval(`console.log(chalk.${token[i][2].remString()}(Number(token[i][1])))`);
                }
            } else if (token[i][1].isVariable()) {
                if (token[i][2].isVariable()) {
                    eval(`console.log(chalk.${variable[token[i][2]]}(variable[token[i][1]]))`);
                } else {
                    eval(`console.log(chalk.${token[i][2].remString()}(variable[token[i][1]]))`);
                }
            }
        }

        if (token[i][0] === "print:single:color") {
            if (token[i][1].isString()) {
                if (token[i][2].isVariable()) {
                    eval(`process.stdout.write(chalk.${variable[token[i][2]]}(token[i][1].remString()))`);
                } else {
                    eval(`process.stdout.write(chalk.${token[i][2].remString()}(token[i][1].remString()))`);
                }
            } else if (token[i][1].isNumber()) {
                if (token[i][2].isVariable()) {
                    eval(`process.stdout.write(chalk.${variable[token[i][2]]}(Number(token[i][1])))`);
                } else {
                    eval(`process.stdout.write(chalk.${token[i][2].remString()}(Number(token[i][1])))`);
                }
            } else if (token[i][1].isVariable()) {
                if (token[i][1].isVariable()) {
                    eval(`process.stdout.write(chalk.${variable[token[i][2]]}(variable[token[i][1]]))`);
                } else {
                    eval(`process.stdout.write(chalk.${token[i][2].remString()}(variable[token[i][1]]))`);
                }
            }
        }

        if (token[i][0] === "prompt") {
            if (token[i][1].remString !== "") {
                if (token[i][1].isString()) {
                    if (token[i][2].startsWith("$") && token[i][2].slice(1) !== "") {
                        variable[token[i][2].slice(1)] = prompt(token[i][1].remString());
                    }
                } else if (token[i][1].isNumber()) {
                    if (token[i][2].startsWith("$") && token[i][2].slice(1) !== "") {
                        variable[token[i][2].slice(1)] = prompt(Number(token[i][1]));
                    }
                } else if (token[i][1].isVariable()) {
                    if (token[i][2].startsWith("$") && token[i][2].slice(1) !== "") {
                        variable[token[i][2].slice(1)] = prompt(variable[token[i][1]]);
                    }
                }
            }
        }

        if (token[i][0] === "exec") {
            if (token[i][1] !== "") {
                if (token[i][1].isString()) {
                    const pythonProcess = spawn('python', ['./parser.py', token[i][1].remString(), "exec"]);
    
                    pythonProcess.stdout.on('data', (data) => {
                        console.log(`${data}`);
                    });
                } else if (token[i][1].isVariable()) {
                    const pythonProcess = spawn('python', ['./parser.py', variable[token[i][1]], "exec"]);
    
                    pythonProcess.stdout.on('data', (data) => {
                        console.log(`${data}`);
                    });
                }
            }
        }

        if (token[i][0] === "file:read") {
            if (token[i][1] !== "") {
                if (token[i][2].startsWith("$") && token[i][2].slice(1) !== "") {
                    if (token[i][1].isString()) {
                        variable[token[i][2].slice(1)] = fs.readFileSync("./Code/" + token[i][1].remString(), "utf-8");
                    } else if (token[i][1].isVariable()) {
                        variable[token[i][2].slice(1)] = fs.readFileSync("./Code/" + variable[token[i][1]], "utf-8");
                    }
                }
            }
        }

        if (token[i][0] === "file:write") {
            if (token[i][1] !== "") {
                if (token[i][2] !== "") {
                    if (token[i][1].isString()) {
                        if (token[i][2].isString()) {
                            fs.writeFileSync("./Code/" + token[i][1].remString(), token[i][2].remString());
                        } else if (token[i][2].isNumber()) {
                            fs.writeFileSync("./Code/" + token[i][1].remString(), Number(token[i][2]));
                        } else if (token[i][2].isVariable()) {
                            fs.writeFileSync("./Code/" + token[i][1].remString(), variable[token[i][2]]);
                        }
                    } else if (token[i][1].isNumber()) {
                        if (token[i][2].isString()) {
                            fs.writeFileSync("./Code/" + Number(token[i][1]), token[i][2].remString());
                        } else if (token[i][2].isNumber()) {
                            fs.writeFileSync("./Code/" + Number(token[i][1]), Number(token[i][2]));
                        } else if (token[i][2].isVariable()) {
                            fs.writeFileSync("./Code/" + Number(token[i][1]), variable[token[i][2]]);
                        }
                    } else if (token[i][1].isVariable()) {
                        if (token[i][2].isString()) {
                            fs.writeFileSync("./Code/" + variable[token[i][1]], token[i][2].remString());
                        } else if (token[i][2].isNumber()) {
                            fs.writeFileSync("./Code/" + variable[token[i][1]], Number(token[i][2]));
                        } else if (token[i][2].isVariable()) {
                            fs.writeFileSync("./Code/" + variable[token[i][1]], variable[token[i][2]]);
                        }
                    }
                }
            }
        }

        if (token[i][0] === "window:create") {
            if (token[i][1] !== "") {
                if (token[i][1].isString()) {
                    exec("npx electron ./src/electron.js " + token[i][1].remString(), (error, stdout, stderr) => {
                        if (error) {
                            console.error(`Error: ${error.message}`);
                            return;
                        }
                        if (stderr) {
                            console.error(`stderr: ${stderr}`);
                            return;
                        }
                        console.log(`${stdout}`);
                    });
                } else if (token[i][1].isVariable()) {
                    exec("npx electron ./src/electron.js " + variable[token[i][1]], (error, stdout, stderr) => {
                        if (error) {
                            console.error(`Error: ${error.message}`);
                            return;
                        }
                        if (stderr) {
                            console.error(`stderr: ${stderr}`);
                            return;
                        }
                        console.log(`${stdout}`);
                    });
                }
            }
        }        

    }
});
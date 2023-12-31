// Requirements
const fs = require("fs");
const chalk = require("chalk");
const prompt = require('prompt-sync')();
const { spawn, exec } = require('child_process');
const path = require("path");
//const storage = require('node-persist');

// File requirements
const lex = require("./lexer");
const { isString, remString } = require("./functions");

// Getting the Sparky file to load
if (process.argv[2].endsWith(".spk")) {
    code = fs.readFileSync(process.argv[2], "utf-8");
} else {
    console.log("You can't load a file that isn't a .spk.")
}

function error(type, string) {
    const fullPath = path.join(__dirname.slice(0, -4), process.argv[2]);
    const lastBackslashIndex = fullPath.lastIndexOf('\\');
    const modifiedFilename = chalk.gray(fullPath.substring(0, lastBackslashIndex + 1)) + chalk.yellow(fullPath.substring(lastBackslashIndex + 1));
    console.log(`${type}: ${string}\n\tAt file ${modifiedFilename}`);
}

let codeNT = code;
let token = lex(code);

async function main() {
    let variable = {};
    let foundIf = false;
    let imports = [];
    for (let i = 0; i < token.length; i++) {
    
        // Libs
        fs.readdir(__dirname.slice(0, -3) + "lib", "utf-8", function(err, file) {
            file.forEach(function(files) {
                const lib = fs.readFileSync(__dirname.slice(0, -3) + `lib/${files}`, "utf-8");
                eval(lib);
            });
        });

        // Variables
        if (token[i][0] === "set") {
            if (token[i][1] !== "") {
                if (token[i][2] === "=") {
                    if (token[i][3] !== "") {
                        var concatenatedValue = "";
        
                        if (token[i][3].includes(".")) {
                            let parts = token[i][3].split(".");
                            let name = parts.shift();
                            let nestedValue = variable[name];
        
                            for (let g = 0; g < parts.length; g++) {
                                nestedValue = nestedValue[parts[g]];
                                if (nestedValue === undefined) {
                                    console.error("Error:", token[i][3], "is not a valid property.");
                                    break;
                                }
                            }
        
                            variable[token[i][1]] = nestedValue;
                        } else {
                            for (var j = 3; j < token[i].length; j++) {
                                if (typeof token[i][j] === 'string') {
                                    concatenatedValue += token[i][j];
                                }
                            }
        
                            if (/^\s*(\d+\s*(\/\s*\d+)?\s*([-+*/]\s*\d+\s*)*)\s*$/.test(concatenatedValue)) {
                                variable[token[i][1]] = eval(concatenatedValue);
                            } else {
                                try {
                                    const jsonValue = JSON.parse(concatenatedValue);
                                    variable[token[i][1]] = jsonValue;
                                } catch (e) {
                                    if (e instanceof SyntaxError) {
                                        error("SyntaxError", "Invalid JSON syntax.");
                                        process.exit(0);
                                    } else {
                                        error("TypeError", "Error parsing value as JSON");
                                        process.exit(0);
                                    }
                                }
                            }
                        }
                    }
                } else {
                    console.error("SyntaxError", `Unexpected token '${token[i][2]}'`);
                }
            }
        }


        if (token[i][0] === "const") {
            if (token[i][1].isVariable()) {
                let originalValue = variable[token[i][1]];
                let hasBeenSet = false;
        
                Object.defineProperty(variable, token[i][1], {
                    get: function() {
                        return originalValue;
                    },
                    set: function(newValue) {
                        if (!hasBeenSet) {
                            originalValue = newValue;
                            hasBeenSet = true;
                        } else {
                            error("TypeError", "You can't change the value of a constant variable.");
                            process.exit(0);
                        }
                    },
                    configurable: false,
                    enumerable: true
                });
            } else {
                error("TypeError", "You can only set a variable to a constant.");
            }
        }        

        if (token[i][0] === "str") {
            if (token[i][1].isVariable()) {
                const originalValue = variable[token[i][1]];
                let storedValue = String(originalValue);
        
                Object.defineProperty(variable, token[i][1], {
                    get: function() {
                        return storedValue;
                    },
                    set: function(newValue) {
                        if (typeof newValue !== 'number') {
                            storedValue = String(newValue); // Update the stored string value
                        } else {
                            error("TypeError", "You can't set a str variable to an int variable.");
                            process.exit(0);
                        }
                    },
                    configurable: true,
                    enumerable: true
                });
            } else {
                error("TypeError", "You can only set a variable to a string.");
            }
        }

        if (token[i][0] === "int") {
            if (token[i][1].isVariable()) {
                const originalValue = variable[token[i][1]];
                let storedValue = parseInt(originalValue, 10);
        
                Object.defineProperty(variable, token[i][1], {
                    get: function() {
                        return storedValue;
                    },
                    set: function(newValue) {
                        if (Number.isInteger(newValue)) {
                            storedValue = newValue;
                        } else {
                            error("TypeError", "You can't set an int variable to a non-integer value.");
                            process.exit(0);
                        }
                    },
                    configurable: true,
                    enumerable: true
                });
            } else {
                error("TypeError", "You can only set a variable to an integer.");
            }
        }        

        const outputString = codeNT.replace(/#\{([^}]+)\}/g, (match, key) => {
            return variable[key] !== undefined ? variable[key] : match;
        });
        token = lex(outputString);
    
        // PREMADE VARIABLES
        variable["DATE"] = new Date();
        variable["DIRNAME"] = __dirname;
        variable["FILENAME"] = __filename;

        // CONTINUE SETTING ERRORS FOR UNDER HERE

        // Print
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
    
        if (token[i][0] === "print:error") {
            if (token[i][1].isString()) {
                console.error(token[i][1].remString());
            } else if (token[i][1].isNumber()) {
                console.error(Number(token[i][1]));
            } else if (token[i][1].isVariable()) {
                console.error(variable[token[i][1]]);
            }
        }
    
        if (token[i][0] === "print:warn") {
            if (token[i][1].isString()) {
                console.warn(token[i][1].remString());
            } else if (token[i][1].isNumber()) {
                console.warn(Number(token[i][1]));
            } else if (token[i][1].isVariable()) {
                console.warn(variable[token[i][1]]);
            }
        }
    
        if (token[i][0] === "print:info") {
            if (token[i][1].isString()) {
                console.info(token[i][1].remString());
            } else if (token[i][1].isNumber()) {
                console.info(Number(token[i][1]));
            } else if (token[i][1].isVariable()) {
                console.info(variable[token[i][1]]);
            }
        }
    
        if (token[i][0] === "print:clear") {
            console.time("t");
            console.clear();
            console.timeEnd("t");
        }
    
        if (token[i][0] === "print:createTimer") {
            if (token[i][1] !== "") {
                console.time(token[i][1]);
            }
        }
    
        if (token[i][0] === "print:endTimer") {
            if (token[i][1] !== "") {
                console.timeEnd(token[i][1]);
            }
        }
    
        // Prompt
        if (token[i][0] === "prompt") {
            if (token[i][1].remString() !== "") {
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
    
        // Exec
        if (token[i][0] === "exec") {
            if (token[i][1] !== "") {
                if (token[i][1].isString()) {
                    const pythonProcess = spawn('python', ['./src/PythonParser/exec.py', token[i][1].remString()]);
        
                    pythonProcess.stdout.on('data', (data) => {
                        console.log(`${data}`);
                    });
                } else if (token[i][1].isVariable()) {
                    const pythonProcess = spawn('python', ['./src/PythonParser/exec.py', variable[token[i][1]]]);
        
                    pythonProcess.stdout.on('data', (data) => {
                        console.log(`${data}`);
                    });
                }
            }
        }

    
        // File
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
    
        // GUI (Window) -- HTML, CSS, Javascript
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
    
        if (token[i][0] === "calc") {
            let connectedString = "";
            let name = "";
    
            for (let j = 0; j < token[i].length; j++) {
                if (token[i][j] === "calc") {
                    continue;
                }
    
                if (token[i][j].includes("$")) {
                    name = token[i][j].slice(1);
                }

                connectedString += token[i][j].replace(/\$\w+/g, '');
            }
            if (/[A-Za-z]/.test(connectedString)) {
                const alphabetMatches = connectedString.match(/[A-Za-z]/g);
            
                if (alphabetMatches) {
                    let finalString = connectedString;
                    alphabetMatches.forEach(match => {
                        if (variable[match]) {
                            finalString = finalString.replace(new RegExp(match, 'g'), variable[match]);
                        }
                    });
                    
                    if (/^[1-9()+\-*/]+$/.test(finalString)) {
                        variable[name] = eval(finalString);
                    } else {
                        error("TypeError", "Please ensure you only input mathematical expressions.");
                        process.exit(0);
                    }
                }
            } else {
                if (/^[1-9()+\-*/]+$/.test(connectedString)) {
                    variable[name] = eval(connectedString);
                } else {
                    error("TypeError", "Please ensure you only input mathematical expressions.");
                    process.exit(0);
                }
            }
        }
    
        if (token[i][0] === "wait") {
            if (token[i][1] !== "") {
                if (token[i][1].isNumber()) {
                    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
                    await delay(`${Number(token[i][1]) * 1000}`);
                } else if (token[i][1].isVariable()) {
                    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
                    await delay(`${variable[token[i][1]] * 1000}`);
                }
            }
        
        }

        if (token[i][0] === "exit") {
            process.exit(0);
        }

        /*
        if (token[i][0] === "def") {
            let newToken = [];
            token[i].forEach(item => {
                const parts = item.split(':');
                parts.forEach(part => {
                  if (part.includes('$')) {
                    const subParts = part.split('$').filter(subPart => subPart.length > 0);
                    subParts.forEach(subPart => {
                      newToken.push('$' + subPart);
                    });
                  } else {
                    newToken.push(part);
                  }
                });
            });
            if (newToken[1] !== "") {
                for (let k = 2; k < newToken.length; k++) {
                    console.log(newToken[k]);
                    // In the code that will be parsed don't forget to add the variable[newToken[k]] = to the value that will be gotten.
                }                
            }
        }
        */

        /*
        if (token[i].includes("--")) {
            break;
        }

        await storage.init();
        let insideIf;
        if (foundIf) {
            insideIf = token[i];
            await storage.setItem("insideIf", insideIf);
        }

        if (token[i][0] === "if") {
            if (token[i][1].isNumber()) {
                if (token[i][3].isNumber()) {
                    foundIf = true;
                    if (token[i][2] === "==") {
                        if (token[i][1] == token[i][3]) {
                            let insideIfStatement = await storage.getItem("insideIf");
                            await main(insideIfStatement);
                            foundIf = false;
                            continue;
                        }
                    }
                }
            }
        }
        */
    
    }
}

main()
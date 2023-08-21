const chalk = require("chalk");

String.prototype.isString = function() {
    if (this.startsWith("'") || this.startsWith("\"") && this.endsWith("'") || this.endsWith("\"") || this.startsWith("`") && this.endsWith("`")) {
        return true;
    } else {
        return false;
    }
}

String.prototype.remString = function() {
    return this.slice(1, - 1);
}

String.prototype.isNumber = function() {
    if (/\d/.test(this)) {
        return true;
    } else {
        return false;
    }
}

String.prototype.isVariable = function() {
    if (!this.isNumber() && !this.isString()) {
        return true;
    } else {
        return false;
    }
}

function error(string) {
    const filename = __filename;
    const lastBackslashIndex = filename.lastIndexOf('\\');
    const modifiedFilename = chalk.gray(filename.substring(0, lastBackslashIndex + 1)) + chalk.yellow(filename.substring(lastBackslashIndex + 1));
    console.log(`TypeError: ${string}\n\tAt file ${modifiedFilename}`);
}

module.exports = { String, error };
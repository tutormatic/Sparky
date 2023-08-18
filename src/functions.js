String.prototype.isString = function() {
    if (this.startsWith("'") || this.startsWith("\"") && this.endsWith("'") || this.endsWith("\"")) {
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

module.exports = { String };
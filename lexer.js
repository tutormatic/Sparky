function lex(code) {
    const tokenGroups = [];
    const lines = code.trim().split('\n');
    
    let insideMultiLineComment = false;

    for (const line of lines) {
        // Ignore comment lines starting with "//"
        if (line.trim().startsWith("//")) {
            continue;
        }
        
        const tokens = [];
        const pattern = /\/\*[\s\S]*?\*\/|\/\/.*|\/\$[\s\S]*?\$\/|"[^"]+"|'[^']+'|\S+/g;
        
        let match;
        while ((match = pattern.exec(line)) !== null) {
            if (match[0].startsWith("/*")) {
                continue; // Ignore multi-line comments
            } else if (match[0].startsWith("$/")) {
                insideMultiLineComment = false;
                continue;
            } else if (match[0].startsWith("/$")) {
                insideMultiLineComment = true;
                continue;
            } else if (insideMultiLineComment) {
                continue; // Ignore text inside multi-line comments
            }
            
            tokens.push(match[0]);
        }
        
        if (tokens.length > 0) {
            tokenGroups.push(tokens);
        }
    }
    
    return tokenGroups;
}

module.exports = lex;
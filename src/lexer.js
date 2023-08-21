function lex(code) {
    code = code.replaceAll("    ", "__FOUR_SPACES__ ").replaceAll("	", "__TAB__ ");
    const tokenGroups = [];

    const blocks = code.trim().split(';');

    let insideMultiLineComment = false;

    for (const block of blocks) {

        const lines = block.trim().split('\n');

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            line = line.replace(/\\([nrtbf])/g, (match, escaped) => {
                switch (escaped) {
                    case 'n': return '\n';
                    case 'r': return '\r';
                    case 't': return '\t';
                    case 'b': return '\b';
                    case 'f': return '\f';
                    default: return escaped;
                }
            });            
            
            line = line.replace(/\\\\/g, '\\');
            line = line.replace(/\\'/g, "__QUOTE__");
            line = line.replace(/\\"/g, '__DOUBLE_QUOTE__');

            if (line.trim().startsWith("//")) {
                continue;
            }

            const loopMatch = line.match(/^(.*?--\s*(\d+))\s*$/);
            if (loopMatch) {
                const [, originalLine, loopCount] = loopMatch;
                for (let j = 0; j < parseInt(loopCount, 10); j++) {
                    const tokens = [];
                    const pattern = /\/\*[\s\S]*?\*\/|\/\/.*|\/\$[\s\S]*?\$\/|`(?:[^`\\]|\\.)*`|"[^"]+"|'[^']+'|[^'",\s`]+/g;

                    let match;
                    while ((match = pattern.exec(originalLine)) !== null) {
                        if (match[0].startsWith("/*")) {
                            continue;
                        } else if (match[0].startsWith("$/")) {
                            insideMultiLineComment = false;
                            continue;
                        } else if (match[0].startsWith("/$")) {
                            insideMultiLineComment = true;
                            continue;
                        } else if (insideMultiLineComment) {
                            continue;
                        }

                        tokens.push(match[0]);
                    }

                    if (tokens.length > 0) {
                        tokenGroups.push(tokens);
                    }
                }
            } else {
                const tokens = [];
                const pattern = /\/\*[\s\S]*?\*\/|\/\/.*|\/\$[\s\S]*?\$\/|`(?:[^`\\]|\\.)*`|"[^"]+"|'[^']+'|[^'",\s`]+/g;

                let match;
                while ((match = pattern.exec(line)) !== null) {
                    if (match[0].startsWith("/*")) {
                        continue;
                    } else if (match[0].startsWith("$/")) {
                        insideMultiLineComment = false;
                        continue;
                    } else if (match[0].startsWith("/$")) {
                        insideMultiLineComment = true;
                        continue;
                    } else if (insideMultiLineComment) {
                        continue;
                    }

                    const token = match[0].replace(/__DOUBLE_QUOTE__/g, '"').replace(/__QUOTE__/g, "'");
                    tokens.push(token);
                }

                if (tokens.length > 0) {
                    tokenGroups.push(tokens);
                }
            }
        }
    }

    return tokenGroups;
}

module.exports = lex;
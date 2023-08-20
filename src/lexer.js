function lex(code) {
    const tokenGroups = [];

    // Splitting on ;
    const blocks = code.trim().split(';');

    let insideMultiLineComment = false;

    for (const block of blocks) {

        // Splitting on next line
        const lines = block.trim().split('\n');

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // Single line comments
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
                        // Multi-line comments
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
                        continue; // Ignore text inside multi-line comments
                    }

                    tokens.push(match[0]);
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
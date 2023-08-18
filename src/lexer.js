function lex(code) {
    const tokenGroups = [];
    const blocks = code.trim().split(';'); // Split on semicolons to create code blocks

    let insideMultiLineComment = false;

    for (const block of blocks) {
        const lines = block.trim().split('\n'); // Split each code block into lines

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            if (line.trim().startsWith("//")) {
                continue;
            }

            const loopMatch = line.match(/^(.*?--\s*(\d+))\s*$/);
            if (loopMatch) {
                const [, originalLine, loopCount] = loopMatch;
                for (let j = 0; j < parseInt(loopCount, 10); j++) {
                    const tokens = [];
                    const pattern = /\/\*[\s\S]*?\*\/|\/\/.*|\/\$[\s\S]*?\$\/|"[^"]+"|'[^']+'|[^'",\s]+/g;

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
                            continue; // Ignore text inside multi-line comments
                        }

                        tokens.push(match[0]);
                    }

                    if (tokens.length > 0) {
                        tokenGroups.push(tokens);
                    }
                }
            } else {
                const tokens = [];
                const pattern = /\/\*[\s\S]*?\*\/|\/\/.*|\/\$[\s\S]*?\$\/|"[^"]+"|'[^']+'|[^'",\s]+/g;

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

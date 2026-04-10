const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const scriptMatch = html.match(/<script type="module">([\s\S]*?)<\/script>/);
if (scriptMatch) {
    let script = scriptMatch[1];
    script = script.replace(/import\s+.*?from\s+['"].*?['"];?/g, '');
    script = script.replace(/import\s+['"].*?['"];?/g, '');
    try {
        new Function(script);
        console.log("Syntax OK");
    } catch (e) {
        console.error("Syntax Error:", e);
    }
}

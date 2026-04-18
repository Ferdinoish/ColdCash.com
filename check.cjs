const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const scriptMatch = html.match(/<script type="module">([\s\S]*?)<\/script>/);
if (scriptMatch) {
    fs.writeFileSync('extracted.js', scriptMatch[1]);
    console.log('Extracted to extracted.js');
}

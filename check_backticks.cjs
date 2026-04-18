const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');
lines.forEach((line, i) => {
    if (line.includes('onclick=') && line.includes('${')) {
        console.log((i + 1) + ': ' + line.trim());
    }
});

const fs = require('fs');
const acorn = require('acorn');
const html = fs.readFileSync('index.html', 'utf8');

const regex = /on[a-z]+="([^"]*)"/g;
let match;
while ((match = regex.exec(html)) !== null) {
    let code = match[1];
    // Replace template literal interpolations with dummy values to test syntax
    code = code.replace(/\$\{[^}]+\}/g, '0');
    try {
        acorn.parse(code, { ecmaVersion: 2020 });
    } catch (e) {
        console.error('Syntax Error in inline handler:', match[1]);
        console.error(e);
    }
}
console.log('Done checking inline handlers');

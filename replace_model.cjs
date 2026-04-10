const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/model:\s*'gemini-2\.5-flash'/g, "model: 'gemini-3-flash-preview'");
fs.writeFileSync('index.html', html);
console.log("Replaced models");

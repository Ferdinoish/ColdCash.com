const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');
content = content.replace(/'gemini-2\.5-flash'/g, "'gemini-3-flash-preview'");
content = content.replace(/'imagen-3\.0-generate-002'/g, "'gemini-2.5-flash-image'");
fs.writeFileSync('index.html', content);
console.log("Replaced models in current dir");

const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const newExtractJson = `        function extractJson(text) {
            if (!text) return '[]';
            let str = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
            const match = str.match(/(\\[[\\s\\S]*\\]|\\{[\\s\\S]*\\})/);
            return match ? match[0] : str;
        }`;

content = content.replace(/                function extractJson\(text\) \{[\s\S]*?return match \? match\[0\] : str;\n        \}/, newExtractJson);

fs.writeFileSync('index.html', content);
console.log("Fixed extractJson");

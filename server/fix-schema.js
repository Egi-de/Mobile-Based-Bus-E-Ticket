const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

// Remove all non-ASCII characters (including emojis)
content = content.replace(/[^\x00-\x7F]/g, '');

fs.writeFileSync(schemaPath, content, 'utf8');
console.log('✓ Removed non-ASCII characters from schema.prisma');

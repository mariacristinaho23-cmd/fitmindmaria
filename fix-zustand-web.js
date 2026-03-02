const fs = require('fs');
const path = require('path');

function replaceMeta(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            replaceMeta(filePath);
        } else if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
            let content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('import.meta')) {
                content = content.replace(/import\.meta\.env/g, '({MODE:"development"})');
                content = content.replace(/import\.meta/g, '({env:{MODE:"development"}})');
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Patched ${file} in ${dir}`);
            }
        }
    }
}

const zustandEsmPath = path.join(__dirname, 'node_modules', 'zustand', 'esm');
console.log('Patching import.meta in zustand...');
replaceMeta(zustandEsmPath);
console.log('Done!');

const fs = require('fs');
const path = require('path');

function replaceMeta(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            replaceMeta(filePath);
        } else if (filePath.endsWith('.js')) {
            let content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('import.meta')) {
                content = content.replace(/import\.meta\.env/g, '({MODE:"production"})');
                content = content.replace(/import\.meta/g, '({env:{MODE:"production"}})');
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Patched ${file}`);
            }
        }
    }
}

const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    console.log('Patching import.meta in web build...');
    replaceMeta(distPath);
    console.log('Done!');
}

const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const DIST_DIR = path.join(__dirname, 'dist');

const server = http.createServer((req, res) => {
    let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
    let extname = String(path.extname(filePath)).toLowerCase();
    let mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
    };

    let contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('404', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, async () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    try {
        const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
        const page = await browser.newPage();

        page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
        page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
        page.on('requestfailed', request => {
            console.log('BROWSER REQUEST FAILED:', request.url(), request.failure().errorText);
        });

        await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0', timeout: 10000 });
        console.log("Page loaded successfully.");
        await browser.close();
    } catch (e) {
        console.error("Puppeteer Error:", e);
    } finally {
        server.close();
    }
});

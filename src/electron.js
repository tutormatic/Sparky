const { app, BrowserWindow } = require('electron');
const path = require('path');

app.on('ready', () => {
    let mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
        },
    });

    const filePath = path.join(__dirname.slice(0, -4), '', process.argv[2]);
    mainWindow.loadFile(filePath);
});
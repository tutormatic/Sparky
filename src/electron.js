const { app, BrowserWindow, Menu } = require('electron');

app.on('ready', () => {
    let mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
        },
    });

    Menu.setApplicationMenu(null);

    const filePath = __dirname.slice(0, -4) + process.argv[2];
    mainWindow.loadFile(filePath);
});
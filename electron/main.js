const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// Native check for development mode without external dependencies
const isDev = !app.isPackaged;

let mainWindow;
let backendProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 768,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        title: "ERP System",
        icon: path.join(__dirname, '../frontend/public/favicon.ico')
    });

    // Load the frontend
    const startUrl = isDev 
        ? 'http://localhost:5173' 
        : `file://${path.join(__dirname, '../frontend/dist/index.html')}`;
    
    mainWindow.loadURL(startUrl);

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Remove default menu
    mainWindow.setMenuBarVisibility(false);
}

function startBackend() {
    const backendPath = path.join(__dirname, '../backend/server.js');
    console.log('Starting backend at:', backendPath);
    
    // Check if port 5000 is already in use
    const net = require('net');
    const server = net.createServer();

    server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log('Port 5000 is already in use. Assuming backend is already running.');
            return;
        }
    });

    server.once('listening', () => {
        server.close();
        
        backendProcess = spawn('node', [backendPath], {
            env: { ...process.env, PORT: 5000 },
            stdio: 'inherit'
        });

        backendProcess.on('error', (err) => {
            console.error('Failed to start backend process:', err);
        });

        backendProcess.on('exit', (code) => {
            console.log(`Backend process exited with code ${code}`);
        });
    });

    server.listen(5000);
}

app.on('ready', () => {
    startBackend();
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        if (backendProcess) backendProcess.kill();
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// Ensure backend is killed on quit
app.on('before-quit', () => {
    if (backendProcess) backendProcess.kill();
});

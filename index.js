const { app, BrowserWindow, Menu, Tray, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const cp = require("child_process");
const net = require("net");
const config = require(__dirname + '/config.json');

// 端口占用检测
function portIsOccupied(port) {
    let server = net.createServer().listen(port);
    server.on('listening', () => {
        server.close();
        // dialog.showErrorBox('服务未开启', '请重启')；
    });
    server.on('error', (err) => {
        if (err.code === 'EADDRINUsE') { // 端口已被占用
            // ...
        }
    });
}

// 定义原生窗口
const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join(__dirname, 'favicon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    // 加载静态页面
    // win.loadFile("index.html");
    // 加载服务页面
    win.loadURL(config.protocal + '://' + config.ip + ':' + config.port);

    // 打开开发工具
    // win.webContents.openDevTools();

    // 关闭窗口事件监听
    win.on('close', (e) => {
        win.hide();
        win.setSkipTaskbar(true);
        // 阻止窗口关闭默认事件
        e.preventDefault();
    });

    // 系统托盘设置（通知栏菜单）
    let tray = new Tray(path.join(__dirname, 'favicon.ico'));
    tray.setToolTip('CS APP');
    let contextMenu = Menu.buildFromTemplate([{
        label: 'Exit', click: () => { win.destroy(); }
    }]);
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
        win.isVisible() ? win.hide() : win.show();
        win.setSkipTaskbar(win.isVisible() ? false : true);
    });

    portIsOccupied(config.port);
};

// 这段程序将会在 Electron 结束初始化
// 和创建浏览器窗口的时候调用
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(() => {
    // cp.spawn('cmd.exe', ['D:/webServer/start.bat']);

    // 定义路径（其它服务指定路径）
    const filePath = 'D:/webServer/start.bat';
    const nodePath = 'C:/Program Files/nodejs/node.exe';
    const indexPath = 'D:/webServer/index.js';
    
    // 将服务放置到electron包中
    // const filePath = __dirname + '/webServer/start.bat';
    // const nodePath = 'node';
    // const indexPath = __dirname + '/webServer/index.js';
    
    cp.execFile(filePath, [nodePath, indexPath], null, function(error, stdout, stderr){
        if (error !==null) {
            console.log("exec error" + error);
        } else console.log("成功");
        // console.log('stdout: ' + stdout);
        // console.log('stderr: ' + stderr);
    });

    setTimeout(function() {
        createWindow();
    }, 3000);

    app.on("activate", () => {
        // 在 macOS 系统内,  如果没有已开启的应用窗口
        // 点击托盘图标时通常会重新创建一个新窗口
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序。 因此, 通常
// 对应用程序和它们的菜单栏来说应该时刻保持激活状态,
// 直到用户使用 Cmd + Q 明确退出
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        const netCommand = 'netstat -ano|findstr ' + config.port;
        cp.exec(netCommand, { maxBuffer: 5000 * 1024}, function(err, stdout, stderr) {
            if (err) {
                console.log(err)
            } else {
                try {
                    let osMsgArrTemp = stdout.split(' ');
                    let osMsgArr = osMsgArrTemp.filter((item) => {
                        return item && item.trim;
                    });
                    let pid = osMsgArr[4];
                    if (pid.length > 0) {
                        process.kill(`${pid}`) && app.quit();
                    }
                } catch (error) {
                    console.log(error)
                }
            }
        });
    }
});

// 在当前文件中你可以引入所有的主进程代码
// 也可以拆分成几个文件，然后用 require 导入。

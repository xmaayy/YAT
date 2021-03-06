const windowStateManager = require('electron-window-state');
const contextMenu = require('electron-context-menu');
const electron = require('electron');
const { app, BrowserWindow, Menu, Tray } = require('electron');
const serve = require('electron-serve');
const path = require("path");
const { ipcMain } = require('electron');
//const { Store, History} = require(path.join(__dirname, "lib/serverside/basic_db.cjs"));
const fs = require('fs');

const userDataPath = path.join(app.getPath('home'), ".YAT");
class Logger {
	constructor() {
		this.path = path.join(userDataPath, 'YAT_Logs.jsonl');
		if (!fs.existsSync(userDataPath)){
			fs.mkdirSync(userDataPath, { recursive: true });
		}
	}

	log(message) {
		let log_entry = {"timestamp": Date.now(), "message":message}
		fs.appendFileSync(this.path, JSON.stringify(log_entry) + "\n");
	}
}

class Store {
  constructor(opts) {
    this.path = path.join(userDataPath, 'YAT_settings.json');
    this.data = this.parseDataFile(this.path, opts.defaults);
  }
  get(key) {
    return this.data[key];
  }

  set(key, val) {
    this.data[key] = val;
    // I'm not totally sure how to do progressive reads and writes
    // yet so for now we're going to be writing on every set
    fs.writeFileSync(this.path, JSON.stringify(this.data));
  }

  update(object){
	Object.keys(this.data).forEach(k => this.data[k] = object[k]);
    fs.writeFileSync(this.path, JSON.stringify(this.data));
  }


  parseDataFile(filePath, defaults) {
    try {
      return JSON.parse(fs.readFileSync(filePath));
    } catch (error) {
      return defaults;
    }
  }
}

/*
* History is both the 'database' we're using and how we'll be manipulating the
* data because I'm too lazy to follow proper OO principles
*/
class History {
  constructor(opts) {
    this.path = path.join(userDataPath, 'YAT_Sessions.jsonl');
	if (!fs.existsSync(userDataPath)){
		fs.mkdirSync(userDataPath, { recursive: true });
	}
    this.data = this.parseDataFile([]);
    console.log("Data" + this.data)
    console.log(this.data)
  }

  /*
  * IDK if a pure 'get' function makes sense in this case, because its 
  * unlikely that anyone will ever want just 1 record.
  */
  get(key) {
    return this.data[key];
  }

  add(data) {
    this.data.push(data);
    console.log("basic_db" + JSON.stringify(data))
    fs.appendFileSync(this.path, JSON.stringify(data) + "\n");
  }

  countSessions() {
    return this.data.length;
  }

  heatmap() {
    var new_data = this.data.map(e => {
      var a = new Date(e.start_time);
      return [a.getDay(), a.getHours()]
    })
    var days = [
      { name: 'S', data: Array.from({ length: 24 }, (v, i) => 0) },
      { name: 'M', data: Array.from({ length: 24 }, (v, i) => 0) },
      { name: 'T', data: Array.from({ length: 24 }, (v, i) => 0) },
      { name: 'W', data: Array.from({ length: 24 }, (v, i) => 0) },
      { name: 'T', data: Array.from({ length: 24 }, (v, i) => 0) },
      { name: 'F', data: Array.from({ length: 24 }, (v, i) => 0) },
      { name: 'S', data: Array.from({ length: 24 }, (v, i) => 0) }
    ];
    for (const element of new_data) {
      days[element[0]].data[element[1]] += 1;
    }
    return days;
  }

  getTotalTime() {
    var new_data = this.data.map(e => {
      return Math.round(e.length / 1000 / 60);
    })

    function add(accumulator, a) {
      return accumulator + a;
    }
    return new_data.reduce(add, 0); // with initial value to avoid when the array is empty
  }

  getGraphData() {
    const cumulativeSum = (sum => value => sum += value)(0);
    let mins = this.data.map(e => {
      return Math.round(e.length / 1000 / 60);
    })
    let xaxis = this.data.map(e => {
      return e.start_time;
    })
    mins = mins.map(cumulativeSum);
    return {yaxis:mins, xaxis:xaxis}
  }

  parseDataFile(defaults) {
    try {
      let lines = fs.readFileSync(this.path, { encoding: 'utf8', flag: 'r' }).split('\n');
      // We're reading a JSON Lines file, so just map every line to a JSON file
      return lines.filter(e => e !== '').map(e => {
        return (e === '' ? {} : JSON.parse(e));
      })
    } catch (error) {
      console.log(error)
      return defaults;
    }
  }
}

try {
	require('electron-reloader')(module);
} catch (e) {
	console.error(e);
}

const serveURL = serve({ directory: "." });
const port = process.env.PORT || 3000;
const dev = !app.isPackaged;
let mainWindow;
let history = new History({
	configName: 'session_history',
});
let logger = new Logger();
let settings = new Store({defaults:{work_time: 15, break_time: 5, account:"TBD..."}});

function createWindow() {
	let windowState = windowStateManager({
		defaultWidth: 450,
		defaultHeight: 500,
	});

	const mainWindow = new BrowserWindow({
		//backgroundColor: 'whitesmoke',
		titleBarStyle: 'hidden',
		autoHideMenuBar: true,
		trafficLightPosition: {
			x: 17,
			y: 32,
		},
		maxHeight: 450,
		maxWidth: 500,
		minHeight: 450,
		minWidth: 500,
		webPreferences: {
			// We load nothing from the internet, so the
			// only one that could exploit this is someone
			// already on your computer
			enableRemoteModule: true,
			contextIsolation: false,
			nodeIntegration: true,
			devTools: true,
		},
		x: windowState.x,
		y: windowState.y,
		width: windowState.width,
		height: windowState.height,
	});


	windowState.manage(mainWindow);

	mainWindow.once('ready-to-show', () => {
		mainWindow.show();
		mainWindow.focus();
	});

	mainWindow.on('close', () => {
		windowState.saveState(mainWindow);
	});

	return mainWindow;
}


let tray = null
let trayMenu = null;
app.whenReady().then(() => {
	/*
	tray = new Tray(path.join(__dirname, '..', 'static', 'chemical.png'))
	trayMenu = Menu.buildFromTemplate([
		{ label: 'Start a Timer', type: 'radio' },
		{ label: 'Log an Event', type: 'radio' },
	])
	tray.setToolTip('Yet Another Timer')
	tray.setContextMenu(trayMenu)
	*/
})

ipcMain.on("save_settings", (event, arg) => {
	settings.update(arg)
	logger.log("Updated settings")
})

ipcMain.on("load_settings", (event, arg) => {
	event.returnValue = settings.data;
})

ipcMain.on("get_num_sessions", (event, arcg) => {
	if(logger == null){
		logger = new Logger();
	}
	logger.log("Returning sessions")
	event.returnValue = history.countSessions();
})

ipcMain.on("ready", (event, arcg) => {
	logger.log("Returning sessions")
	event.returnValue = userDataPath;
})

ipcMain.on("get_heatmap", (event, arcg) => {
	if(logger == null){
		logger = new Logger();
	}
	logger.log("Returning heatmap")
	event.returnValue = history.heatmap();
})

ipcMain.on("get_total", (event, arcg) => {
	if(logger == null){
		logger = new Logger();
	}
	logger.log("Returning total")
	event.returnValue = history.getTotalTime();
})
ipcMain.on("get_graph", (event, arcg) => {
	if(logger == null){
		logger = new Logger();
	}
	logger.log("Returning graph data")
	event.returnValue = history.getGraphData();
})

ipcMain.on("timer_done", (event, arg) => {
	if(logger == null){
		logger = new Logger();
	}
	logger.log("Timer Finished " + JSON.stringify(arg))
	history.add(arg)
})

contextMenu({
	showLookUpSelection: false,
	showSearchWithGoogle: false,
	showCopyImage: false,
	prepend: (defaultActions, params, browserWindow) => [
		{
			label: 'Stay ???? Focused',
		},
	],
});

function loadVite(port) {
	mainWindow.loadURL(`http://localhost:${port}`).catch((e) => {
		console.log('Error loading URL, retrying', e);
		setTimeout(() => {
			loadVite(port);
		}, 200);
	});
}

function createMainWindow() {
	mainWindow = createWindow();
	mainWindow.once('close', () => { mainWindow = null });

	if (dev) loadVite(port);
	else serveURL(mainWindow);
}

app.once('ready', createMainWindow);
app.on('activate', () => {
	if (!mainWindow) {
		createMainWindow();
	}
});
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});
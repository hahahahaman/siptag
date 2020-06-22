// Modules to control application life and create native browser window
const {app, BrowserWindow, screen, ipcMain, Menu, Tray} = require('electron')
const path = require('path')
const fs = require('fs');
const screenshot = require("screenshot-desktop")
const { uuid } = require('uuidv4');
let Jimp = require("jimp");
let JSON = require("serialize-json");
let snipWindow = null;
let tagWindow = null;
let bounds = null;
let tray = null
let taggedFilename = null;
let tagsDbFile = null;
let filesDbFile = null;
let tagsDb = null;
let filesDb = null;
const directory = path.join(__dirname + '/snips/');


function createSnipWindow (xl, yl) {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    resizable: false,
    /* webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }, */
    enableLargerThanScreen: true,
    frame: false,
    transparent: true,
    // kiosk: true,
    alwaysOnTop: true,
    // skipTaskbar: true,
    hasShadow: false,
    show: true,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  return mainWindow;
}

function createTagWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    resizable: true,
    width: 800,
    height: 800,
    /* webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }, */
    enableLargerThanScreen: false,
    frame: true,
    transparent: false,
    // kiosk: true,
    alwaysOnTop: true,
    // skipTaskbar: true,
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('tag.html')

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  return mainWindow;
}

function calcBounds() {
  let x = 0, y = 0, w = 0, h = 0, maxY = 0, maxX = 0;
  let displays = screen.getAllDisplays()
  displays.forEach(f => {
    maxX = Math.max(maxX, f.bounds.x + f.bounds.width);
    maxY = Math.max(maxY, f.bounds.y + f.bounds.height);

    x = Math.min(x, f.bounds.x);
    y = Math.min(y, f.bounds.y);

    w += f.bounds.width;
    h += f.bounds.height;
  })
  // console.log({x:x, y:y, width:w, height:h, maxX:maxX, maxY:maxY})
  return {x:x, y:y, width:w, height:h, maxX:maxX, maxY:maxY}
}

function createSnip() {
  snipWindow = createSnipWindow()
  bounds = calcBounds()
  // snipWindow.setSize(2000, 1000);
  snipWindow.setBounds(bounds)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // var mainScreen = screen.getPrimaryDisplay();

  // console.log(allScreens);
  
  // // mainWindow.once('ready-to-show', () => {
  // // mainWindow.setBounds({ x: 0, y: 0, width: 1200, height: 1200 })
  // //   // mainWindow.setSize(5000, 5000);
  // //   mainWindow.show()
  // // })

  

  tray = new Tray('./nino.png')
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Snip',
      click() {
        createSnip()
      }
    },
    { 
      label: 'Browse',
    },
    {
      label: "Exit",
      click() {
        if (process.platform !== 'darwin') app.quit()
      }
    }
  ])
  tray.setToolTip("Nino should've won")
  tray.setContextMenu(contextMenu)


  // Init database
  tagsDbFile = path.join(__dirname + '/tags.db');
  filesDbFile = path.join(__dirname + '/files.db');
  // Create files if they don't exist
  if (!fs.existsSync(tagsDbFile)) {
    fs.writeFile(tagsDbFile, '', function (err) {
      if (err) throw err;
      console.log('tags.db is created successfully.');
    }); 
  }
  if (!fs.existsSync(filesDbFile)) {
    fs.writeFile(filesDbFile, '', function (err) {
      if (err) throw err;
      console.log('files.db is created successfully.');
    }); 
  }

  let databuf = fs.readFileSync(tagsDbFile, (err, data) => {
    if (err) throw err;
  });
  if (databuf.length === 0) {
    tagsDb = {
      "nextId": 3,
      1 : {
        "name": "anime",
        "fileIds": []
      }, 
      2 : {
        "name": "manga",
        "fileIds": []
      }
    };
  } else {
    tagsDb = JSON.decode(databuf);
    console.log("tagsDb: ")
    console.log(tagsDb)
  }
  databuf = fs.readFileSync(filesDbFile, (err, data) => {
    if (err) throw err;
  });
  if (databuf.length === 0) {
    filesDb = {
      "nextId": 0
    };
  } else {
    filesDb = JSON.decode(databuf);
    console.log("filesDb: ")
    console.log(filesDb)
  }

  // console.log(databuf.length);
  
  // let result = {
  //   a: "b"
  // }
  // const buf = JSON.encode(result);

  // Write files
  // fs.writeFileSync(tagsDbFile, buf)
  // Read files


  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    // if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function (event) {
  // if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
function imgToDisk(buf, filename) {
  const filepath = path.join(directory + filename);
  if (!fs.existsSync(directory)){
    fs.mkdirSync(directory);
    console.log("dir doesn't exsit")
  }
  fs.writeFile(filepath, buf, 'base64', (err) => {
    if(err) console.log(err);
  });
  console.log("finished img");
}

async function cropAndStitch(displays, imgBufs, cropBounds) {
  //Create bg image
  let bg = new Jimp(bounds.maxX - bounds.x, bounds.maxY - bounds.y, 'black', (err, image) => {
    if (err) throw err
  })

  for (let i = 0; i < displays.length; ++i) { 
    let img = await Jimp.read(imgBufs[i]);
    bg.blit(img, displays[i].left, displays[i].top)
    //console.log(img)
  }
  const filename = uuid() + '.png'
  bg.crop(cropBounds.x, cropBounds.y, cropBounds.w, cropBounds.h)
  bg.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
    // console.log("jimp: " + buffer);
    imgToDisk(buffer, filename);
  });
  return filename;
}

async function desktopScreenshot(cropBounds) {
  let displays = await screenshot.listDisplays()

  // displays: [{ id, name }, { id, name }]
  // console.log(displays);
  let imgBufs = []
  for (let i = 0; i < displays.length; ++i) {
    let d = displays[i];
    // console.log(d);
    let img = await screenshot({ screen: d.id, format: 'png'})
    // console.log(img);
    imgBufs.push(img);
    //imgToDisk(img);
  }
  let filename = await cropAndStitch(displays, imgBufs, cropBounds)
  return filename
    /* displays.forEach((display) => {
      console.log("id: " + display.id)
      console.log("name: " + display.name)
      
      let img = await screenshot({ screen: display.id, format: 'png'})
      console.log(img);
      // .then((img) => {
      //   // img: Buffer of screenshot of the last display
      //   // img: Buffer filled with png goodness
      //   // ...
      //   console.log(img);
        
      // }).catch((err) => {
      //   console.log("print error");
      //   console.log(err);
      //   // ...
      // })
    }) */
}

async function applyTags(fileName) {
  taggedFilename = fileName
  // Create tag window, hidden
  tagWindow = createTagWindow();
  // Send db to window
  tagWindow.webContents.once('dom-ready', () => {
    tagWindow.webContents.send('init-db', tagsDb)
    ipcMain.once('done-init-db', (event, arg) => {
      tagWindow.show()
    })
  })
}

function attachTagsToFile(filename, tags) {
  let nextId = filesDb["nextId"]
  filesDb["nextId"]++
  let newFileObj = {
    "name": filename,
    "tagIds" : []
  }

  for (let i = 0; i < tags.length; ++i) {
    let tag = tags[i]
    if (!tag['id']) {
      let nextTagId = tagsDb["nextId"]
      tagsDb["nextId"]++

      let newTagObj = {
        "name": tag['value'],
        "fileIds" : [nextId]
      }
      tagsDb[nextTagId] = newTagObj
      newFileObj["tagIds"].push(nextTagId)
    } else {
      let tagInDb = tagsDb[tag['id']]
      tagInDb["fileIds"].push(nextId)
      newFileObj["tagIds"].push(parseInt(tag['id']))
    }
  }

  filesDb[nextId] = newFileObj

  console.log(tagsDb)
  console.log(filesDb)
}

function writeDbs() {
  let fileDbBuf = JSON.encode(filesDb)
  let tagsDbBuf = JSON.encode(tagsDb)
  fs.writeFileSync(filesDbFile, fileDbBuf)
  fs.writeFileSync(tagsDbFile, tagsDbBuf)
  console.log("done write to dbs")
}

ipcMain.on('chosen_tags', async (event, arg) => {
  console.log(arg)
  tagWindow.close();
  tagWindow = null;
  //write to databases
  attachTagsToFile(taggedFilename, arg)
  writeDbs()
  taggedFilename = null
})
//recieve new db from tag window
//close tag window
//update entry and write db to files

ipcMain.on('bounds', async (event, arg) => {
  // console.log(arg)
  // mainWindow.capturePage().then((img) => {
  //   let buf = img.toPNG()
  //   fs.writeFile('test.png', buf, 'base64', function(err) {})
  // });
  // cropAndStitch()
  snipWindow.close();
  snipWindow = null;
  let filename = await desktopScreenshot(arg)
  console.log(filename)
  applyTags(filename)
})

ipcMain.on('close', (event, arg) => {
  snipWindow.close();
  snipWindow = null;
})

// function captureScreen(bounds,e) {
//   this.getScreenShot((image) => {

//       let encondedImageBuffer = new Buffer(image.replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64');

//       Jimp.read(encondedImageBuffer, (err, image) => {
//           if (err) throw err;

//           let crop = bounds ?
//                       image.crop(bounds.x, bounds.y, parseInt(bounds.width, 10), parseInt(bounds.height, 10)) :
//                       image.crop(0,0, 800,800/* screenSize.width, screenSize.height */);

//           crop.getBase64('image/png', (err,image) =>{
//             const directory = path.join(__dirname + '/snips');
//             const filepath = path.join(directory + '/' + uuidv4() + '.png');
//             if (!fs.existsSync(directory)){
//               fs.mkdirSync(directory);
//             }
//             fs.writeFile(filepath, image.replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64', (err) => {
//                 if(err) console.log(err);
//                 // shell.showItemInFolder(filepath);
//             });
//           });
//       });
//   });
// }




const { ipcRenderer, desktopCapturer } = require('electron')

// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
var canvas = document.getElementById("canvas");
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;
var ctx = canvas.getContext('2d');
//Variables
var canvasx = $(canvas).offset().left;
var canvasy = $(canvas).offset().top;
var last_mousex = last_mousey = 0;
var mousex = mousey = 0;
var mousedown = false;
var bounds = null;

//Mousedown
$(canvas).mousedown( function(e) {
    console.log(e);
    if (e.which === 1) {
        last_mousex = parseInt(e.clientX-canvasx);
        last_mousey = parseInt(e.clientY-canvasy);
        mousedown = true;
        bounds = null
    }
});

//Mouseup
$(canvas).mouseup( function(e) {
    mousedown = false;
    ctx.clearRect(0,0,canvas.width,canvas.height); //clear canvas
    console.log("hit");
    if (bounds != null && e.which === 1) {
        if (bounds.width < 0) {
            bounds.x += bounds.width
            bounds.width = -bounds.width
        }
          
        if (bounds.height < 0) {
            bounds.y += bounds.height
            bounds.height = -bounds.height
        }
        ipcRenderer.send('bounds', bounds)
    } else {
        ipcRenderer.send('close')
    }
    
});

//Mousemove
$(canvas).on('mousemove', function(e) {
    mousex = parseInt(e.clientX-canvasx);
	mousey = parseInt(e.clientY-canvasy);
    if(mousedown) {
        ctx.clearRect(0,0,canvas.width,canvas.height); //clear canvas
        ctx.beginPath();
        var width = mousex-last_mousex;
        var height = mousey-last_mousey;
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = "#303030";
        ctx.fillRect(last_mousex,last_mousey,width,height);
        ctx.strokeStyle = 'rgba(255, 255, 255, 1)'
        let strSize = 0.5;
        ctx.strokeRect(last_mousex-strSize,last_mousey-strSize,width+strSize,height+strSize);
        bounds = {x: last_mousex, y: last_mousey, w: width, h: height}
    }
});

// function getScreenShot() {
//     let _this = this;
//     imageFormat = 'image/png';
    

//     function handleStream (stream) {
//         const video = document.querySelector('video')
//         video.srcObject = stream
//         video.onloadedmetadata = (e) => {
//             console.log("OKKKK")
//         }
//         // video_dom.onloadedmetadata = function () {
//         //     // Set video ORIGINAL height (screenshot)
//         //     video_dom.style.height = this.videoHeight + 'px'; // videoHeight
//         //     video_dom.style.width = this.videoWidth + 'px'; // videoWidth

//         //     // Create canvas
//         //     let canvas2 = document.createElement('canvas2');
//         //     canvas2.width = this.videoWidth;
//         //     canvas2.height = this.videoHeight;
//         //     let ctx = canvas2.getContext('2d');
//         //     // Draw video on canvas
//         //     ctx.drawImage(video_dom, 0, 0, canvas.width, canvas.height);

//         //     if (_this.callback) {
//         //         // Save screenshot to base64
//         //         imgData = canvas2.toDataURL(imageFormat);
//         //         ipcRenderer.send('image', imgData)
//         //     } else {
//         //         console.log('Need callback!');
//         //     }

//         //     // Remove hidden video tag
//         //     video_dom.remove();
//         //     try {
//         //         // Destroy connect to stream
//         //         stream.getTracks()[0].stop();
//         //     } catch (e) {}
//         // };
//         // video_dom.src = URL.createObjectURL(stream);
//         // document.body.appendChild(video_dom);

//     };

//     function handleError(e) {
//         console.log(e);
//     };
    
//     desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
//         for (const source of sources) {
//           if (source.name === 'Elecdwatron') {
//             try {
//               const stream = await navigator.mediaDevices.getUserMedia({
//                 audio: false,
//                 video: {
//                   mandatory: {
//                     chromeMediaSource: 'desktop',
//                     chromeMediaSourceId: source.id,
//                     minWidth: 1280,
//                     maxWidth: 1280,
//                     minHeight: 720,
//                     maxHeight: 720
//                   }
//                 }
//               })
//               handleStream(stream)
//             } catch (e) {
//               handleError(e)
//             }
//             return
//           }
//         }
//     })
//     Console.log('asd')
// }


// function handleStream (stream) {
    // video_dom.onloadedmetadata = function () {
    //     // Set video ORIGINAL height (screenshot)
    //     video_dom.style.height = this.videoHeight + 'px'; // videoHeight
    //     video_dom.style.width = this.videoWidth + 'px'; // videoWidth

    //     // Create canvas
    //     let canvas2 = document.createElement('canvas2');
    //     canvas2.width = this.videoWidth;
    //     canvas2.height = this.videoHeight;
    //     let ctx = canvas2.getContext('2d');
    //     // Draw video on canvas
    //     ctx.drawImage(video_dom, 0, 0, canvas.width, canvas.height);

    //     if (_this.callback) {
    //         // Save screenshot to base64
    //         imgData = canvas2.toDataURL(imageFormat);
    //         ipcRenderer.send('image', imgData)
    //     } else {
    //         console.log('Need callback!');
    //     }

    //     // Remove hidden video tag
    //     video_dom.remove();
    //     try {
    //         // Destroy connect to stream
    //         stream.getTracks()[0].stop();
    //     } catch (e) {}
    // };
    // video_dom.src = URL.createObjectURL(stream);
    // document.body.appendChild(video_dom);

// };

// function handleError(e) {
//     console.log(e);
// };

// desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
//     for (let source of sources) {
//         console.log("Name: " + source.name);
//         addSource(source);
//     }
// })
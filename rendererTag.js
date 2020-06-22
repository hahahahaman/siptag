const { ipcRenderer} = require('electron')

// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
let tagsDb = null
let chosenTags = []
let selectTag = null

ipcRenderer.on('init-db', (event, arg) => {
    tagsDb = []
    for (var key in arg) {
        if (key == "nextId") continue;
        var tag = {label: arg[key]["name"], value: arg[key]["name"], id: key}
        tagsDb.push(tag)
    }
    console.log(tagsDb)
    event.sender.send('done-init-db', "")

    $("#tag_input").autocomplete({
        source: tagsDb,
        autoFocus: false,
        select:  function( event, ui ) {
            selectTag = ui.item;
            console.log("Select tag:") 
            console.log(selectTag)
        }
    });
})

$(document).on('keypress',function(e) {
    if(e.which == 13) {
        let tagName = $("#tag_input").val()
        tagName = tagName.trim()
        if (tagName) {
            if (selectTag == null || tagName !== selectTag.label) {
                let matched = false;
                for (let i=0; i < tagsDb.length; ++i) {
                    let tag = tagsDb[i];
                    console.log("cmp: urTag: " + tagName + " with " + tag.value)
                    if (tagName == tag.value) {
                        matched = true
                        selectTag = tag
                    }
                }
                if (!matched) {
                    selectTag = {value: tagName, id: null}
                }
            }
            console.log("enter select tag:") 
            console.log(selectTag)
            // if (jQuery.inArray( selectTag, chosenTags ) == -1) {
            
            // }
            let tagAlreadyExists = false
            for (let i = 0; i < chosenTags.length; ++i) {
                if (selectTag['value'] == chosenTags[i]['value']) {
                    tagAlreadyExists = true
                }
            }
            if (!tagAlreadyExists) {
                chosenTags.push(selectTag)
                $("#tags").append("<p>" + tagName + "</p>")
            }
            selectTag = null;
            $("#tag_input").val("")
            $("#tag_input").autocomplete("close")
        }
    }
    console.log("chosenTags")
    console.log(chosenTags)
});

$("#send").click(function( event ) {  
    ipcRenderer.send('chosen_tags', chosenTags)
});  
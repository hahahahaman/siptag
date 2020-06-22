[Transparency on linux](#transparency-on-linux)

# Transparency on linux
https://stackoverflow.com/questions/54763647/transparent-windows-on-linux-electron
using `--disable-gpu` will make it so the transparent window is clickthroughable, we don't want this. Just setting the transparency flag works.

tags.db
{
    "nextId": 0,
    id# : {
        "name": "tagName",
        "fileIds: [id#, id#, id#]
    }, 
    id# : {
        "name": "tagName",
        "fileIds: [id#, id#, id#]
    },
}

files.db
{
    "nextId": 0,
    id# : {
        "name": "fileName",
        "tagIds: [id#, id#, id#]
    }, 
    id# : {
        "name": "fileName",
        "tagIds: [id#, id#, id#]
    },
}
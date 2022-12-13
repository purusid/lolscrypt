let indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
if (localStorage.getItem("firstRun") != "false") {
    localStorage.setItem("dbVersion", 1);
    localStorage.setItem("firstRun", "false")
};
const lolScrypt = {
    defs: {
        dbName: "lolScrypt",
        dbVersion: parseInt(localStorage.getItem("dbVersion")),
        currentProject: "default"
    },
    editor: class {

    },
    db: {
        writeFile: (data, callback) => {
            lolScrypt.init(function () {
                if ((data != null) && (lolScrypt.defs.currentProject != null)) {
                    let open = indexedDB.open(lolScrypt.defs.dbName, lolScrypt.defs.dbVersion);
                    open.onupgradeneeded = function () {
                        let db = open.result;
                        let store = db.createObjectStore(lolScrypt.defs.currentProject, { keyPath: "file.path" });
                        let index = store.createIndex("FileIndex", ["file.path", "file.base64data"]);
                    };
                    open.onsuccess = function () {
                        let db = open.result;
                        let tx = db.transaction(lolScrypt.defs.currentProject, "readwrite");
                        let store = tx.objectStore(lolScrypt.defs.currentProject);
                        store.add(data);
                        tx.oncomplete = function () {
                            db.close();
                            if (callback)
                                callback(true);
                        };
                        tx.onerror = () => {
                            console.error("lolScrypt.db.writeFile: error writing to database: " + tx.error);
                            db.close();
                            if (callback)
                                callback(false);
                        };
                    };
                    open.onerror = () => {
                        console.error("Error accessing database: " + open.error);
                        if (callback)
                            callback(false);
                    };
                }
                else {
                    console.error("Error: incorrect arguments");
                    if (callback)
                        callback(false);
                }
            });
        },
        readFile: (path, callback) => {
            if (path == "" || path == null) {
                console.error("lolScrypt.db.readFile: path is empty");
            }
            else {
                let open = indexedDB.open(lolScrypt.defs.dbName, lolScrypt.defs.dbVersion);
                open.onsuccess = function () {
                    let db = open.result;
                    let tx = db.transaction(lolScrypt.defs.currentProject, "readonly");
                    let store = tx.objectStore(lolScrypt.defs.currentProject);
                    let req = store.get(path);
                    req.onsuccess = (e) => {
                        if (callback)
                            callback(req.result.file);
                        db.close();
                    };
                    req.onerror = function () {
                        console.error(req.error);
                        db.close();
                    };
                    tx.oncomplete = function () {
                        db.close();
                    };
                    tx.onerror = () => {
                        alert("Error saving file to database: " + tx.error);
                        db.close();
                    };
                };
                open.onerror = () => {
                    alert("Error accessing database: " + open.error);
                    db.close();
                };
            }
        },
        listProjects: (callback) => {
            let open = indexedDB.open(lolScrypt.defs.dbName, lolScrypt.defs.dbVersion);
            open.onsuccess = function () {
                let db = open.result;
                if (callback) { callback(db.objectStoreNames); }
                db.close();
            };
            open.onerror = () => {
                alert("Error accessing database: " + open.error);
                open.close();
            };
        },
        listFiles: (callback) => {
            let open = indexedDB.open(lolScrypt.defs.dbName, lolScrypt.defs.dbVersion);
            open.onsuccess = function () {
                let db = open.result;
                let tx = db.transaction(lolScrypt.defs.currentProject, "readonly");
                let store = tx.objectStore(lolScrypt.defs.currentProject);
                let index = store.index("FileIndex");
                let items = [];
                tx.oncomplete = function () {
                    db.close();
                    if (callback)
                        callback(items);
                    console.table(items);
                };
                tx.onerror = () => {
                    alert("Error saving file to database: " + tx.error);
                    db.close();
                    if (callback)
                        callback(false);
                };
                let cur = index.openCursor();
                cur.onerror = function (error) {
                    console.error(error);
                };
                cur.onsuccess = function (evt) {
                    let cursor = evt.target.result;
                    if (cursor) {
                        items.push(cursor.value);
                        cursor.continue();
                    }
                };
            };
            open.onerror = () => {
                alert("Error accessing database: " + open.error);
                db.close();
                if (callback)
                    callback(false);
            };
        }
    },
    init: (callback) => {
        lolScrypt.db.listProjects((list) => {
            if (Array.from(list).includes(lolScrypt.defs.currentProject)) {
                proceed();
            }
            else {
                localStorage.setItem("dbVersion", parseInt(localStorage.getItem("dbVersion")) + 1);
                lolScrypt.defs.dbVersion = parseInt(localStorage.getItem("dbVersion"));
                proceed();
            }
            function proceed() {
                let open = indexedDB.open(lolScrypt.defs.dbName, lolScrypt.defs.dbVersion);
                open.onupgradeneeded = function () {
                    let db = open.result;
                    let store = db.createObjectStore(lolScrypt.defs.currentProject, { keyPath: "file.path" });
                    let index = store.createIndex("FileIndex", ["file.path", "file.base64data"]);
                };
                open.onerror = function () {
                    if (callback)
                        callback(false);
                };
                document.getElementById("init").style.display = "none";
                if (callback) { callback(true); }
            }
        });
    },
    createProject: () => {
        let n = prompt("Project Name:");
        if (confirm(`Confirm project creation with name '${n}':`)) {
            lolScrypt.defs.currentProject = n;
            lolScrypt.db.writeFile({ file: { path: "/welcome.txt", base64data: "welcome" } }, () => (lolScrypt.reloadFiles()));
        } else {
            return;
        }
    },
    reloadFiles: () => {
        let elem = document.getElementById("nav");
        elem.innerHTML = null;
        lolScrypt.db.listFiles((a) => {
            a.forEach((i) => {
                elem.innerHTML += `<div onclick="lolScrypt.createEditor('${i.file.path}')">${i.file.path}</div>`
            })
        })
    },
    setCurrentProject: (n) => {
        lolScrypt.defs.currentProject = n;
        lolScrypt.init(() => (lolScrypt.reloadFiles()));
    },
    onload: () => {
        let pls = document.getElementById("pls");
        lolScrypt.db.listProjects((list) => (Array.from(list).forEach((item) => {
            pls.innerHTML += `<a href="javascript:lolScrypt.setCurrentProject('${item}')"><div>${item}</div><img src="https://purusid.tk/ico/rt-arrow.png" alt="ARROW"></a>`;
        })));
    },
    createEditor(n, callback) {
        lolScrypt.db.readFile(n, (a) => { document.getElementById("code").innerText = a.base64data })
    }
}

function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (document.getElementById(elmnt.id + "header")) {
        /* if present, the header is where you move the DIV from:*/
        document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
    } else {
        /* otherwise, move the DIV from anywhere inside the DIV:*/
        elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        /* stop moving when mouse button is released:*/
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

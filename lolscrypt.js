let indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
let dbName = "lolScrypt";
let dbVersion = 1;

const lolScrypt = {
    defs: {
        dbName: "lolScrypt",
        dbVersion: 1
    },
    dbHandlers: {
        write: function (data) {
            console.log(data);
            lolScrypt.initDB(function () {
                if ((data != null) && (lolScrypt.defs.currentProject != null)) {
                    let open = indexedDB.open(lolScrypt.defs.dbName, lolScrypt.defs.dbVersion);
                    open.onupgradeneeded = function () {
                        let db = open.result;
                        let store = db.createObjectStore(lolScrypt.defs.dbName, { keyPath: "file.path" });
                        let index = store.createIndex("FileIndex", ["file.path", "file.base64data"]);
                    };
                    open.onsuccess = function () {
                        let db = open.result;
                        let tx = db.transaction(lolScrypt.defs.currentProject, "readwrite");
                        let store = tx.objectStore(lolScrypt.defs.currentProject);
                        store.add(data);
                        tx.oncomplete = function () {
                            db.close();
                        };
                        tx.onerror = () => {
                            console.log("lolScrypt.file.write: error writing to database: " + tx.error);
                            db.close();
                        };
                    }
                    open.onerror = () => {
                        alert("Error accessing database: " + open.error);
                    }
                }
                else {
                    console.log("Error: project not defined")
                }
            });
        },
        read: function (path, callback) {
            if (path == "" || path == null) {
                console.error("lolScrypt.file.read: path is empty")
            }
            else {
                let open = indexedDB.open(lolScrypt.defs.dbName, lolScrypt.defs.dbVersion);
                open.onsuccess = function () {
                    let db = open.result;
                    let tx = db.transaction(lolScrypt.defs.currentProject, "readonly");
                    let store = tx.objectStore(lolScrypt.defs.currentProject);
                    let req = store.get(path);
                    req.onsuccess = (e) => {
                        if (callback) callback(req.result);
                        db.close();
                    };
                    req.onerror = function () {
                        console.error(req.error);
                        db.close();
                    }
                    tx.oncomplete = function () {
                        db.close();
                    };
                    tx.onerror = () => {
                        alert("Error saving file to database: " + tx.error);
                        db.close();
                    };
                }
                open.onerror = () => {
                    alert("Error accessing database: " + open.error);
                    db.close();
                }
            }
        },
        listProjects: function () {
            let open = indexedDB.open(lolScrypt.defs.dbName, lolScrypt.defs.dbVersion);
            open.onsuccess = function () {
                let db = open.result;
                if (callback) { callback(db.objectStoreNames); }
                db.close();
            }
            open.onerror = () => {
                alert("Error accessing database: " + open.error);
                db.close();
            }
        }
    },
    init: function (callback) {
        let open = indexedDB.open(lolScrypt.defs.dbName, lolScrypt.defs.dbVersion);
        open.onupgradeneeded = function () {
            let db = open.result;
            let store = db.createObjectStore(lolScrypt.defs.currentProject, { keyPath: "file.path" });
            let index = store.createIndex("FileIndex", ["file.path", "file.base64data"]);
        };
        if (callback) { callback(true) }
        open.onerror = function () {
            if (callback) callback(false)
        }
        lolScrypt.editor = CodeMirror.fromTextArea(document.getElementById("code"), {
            autoCloseTags: true,
            autoCloseBrackets: true,
            mode: "htmlmixed",
            lineNumbers: true,
            extraKeys: {
                "Ctrl-Space": "autocomplete"
            }
        })
        lolScrypt.editor.on("keyup", function (cm, event) {
            let keyCodeList = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "<", "=", " ", "/", "(", ")", "{", "}", "[", "]", "`", "-", "+", "_", "!", "@", "#", "$", "%", "^", "&", "*", ",", ".", ";"]
            if (!cm.state.completionActive && keyCodeList.includes(event.key)) {
                CodeMirror.commands.autocomplete(cm, null, { completeSingle: false });
            }
        });
    },
    editor: ''
}

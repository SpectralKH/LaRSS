window.xhr = function(req, options) {
    // handle options passed as first argument
    if (options === undefined) {
        options = req;
        if (options.req) req = options.req;
        else if (options.json) req = JSON.stringify(options.json);
    }

    // init xhr
    if (!options.url) return "url required";
    if (!options.type) options.type = "POST";
    if (!options.contentType) options.contentType = "application/x-www-form-urlencoded";

    // initiate & send request
    var xhr = new XMLHttpRequest();
    xhr.open(options.type, options.url, true);
    xhr.setRequestHeader("content-type", "application/x-www-form-urlencoded");
    if (options.auth) xhr.setRequestHeader("Authorization", options.auth);
    if (options.headers) {
        for (var i = 0; i < options.headers.length; i++) {
            xhr.setRequestHeader(options.headers[i][0], options.headers[i][1]);
        }
    }
    xhr.send(req);

    // handle response
    xhr.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (String(this.status).startsWith(2)) {
                if (options.callback) options.callback(this.responseText, false);
                if (options.onSuccess) options.onSuccess(this.responseText, this.status);
            } else {
                if (options.callback) options.callback(this.responseText, this.status);
                if (options.onError) options.onError(this.responseText, this.status);
            }
        }
    };
};

(function items() {
    document.addEventListener("click", function(e) {
        if (e.target.classList.contains("collapse-icon")) {
            e.target.parentElement.parentElement.classList.toggle("collapsed");
        }
    });
})();

(function textareaResize() {
    function resizeTextarea(textarea) {
        textarea.style.height = "auto";
        textarea.parentElement.style.height = "auto";
        var newHeight = textarea.scrollHeight;
        var cs = window.getComputedStyle(textarea); // cs == computedStyles
        var padding = Number(cs.paddingTop.slice(0, -2)) + Number(cs.paddingBottom.slice(0, -2));
        textarea.style.height = newHeight+"px";
    }
    window.resizeTextareas = function() {
        var textareas = document.querySelectorAll("textarea");
        for (var i = 0; i < textareas.length; i++) {
            resizeTextarea(textareas[i]);
        }
    }
    resizeTextareas();
    document.addEventListener("input", function(e) {
        if (e.target.tagName == "TEXTAREA") {
            resizeTextarea(e.target);
        }
    });
})();

var pat = localStorage.getItem("pat");
var gistId = localStorage.getItem("gistId");
function getFilename(pat) {
    return {
        json: "LaRSS-"+pat.slice(0,4)+".json",
        rss: "LaRSS-"+pat.slice(0,4)+".rss"
    };
}

load(pat);
function load(pat, callback) {
    if (pat) {
        // if gistId is already saved, load it. Otherwise, find the gistId
        if (gistId) {
            findGist(pat, gistId, function(content, rssURL) {
                // if the gist was found, load it. Otherwise
                if (content) {
                    gistFound(content, rssURL);
                    if (callback) callback();
                } else {
                    createGist(pat, function(id, content, rssURL) {
                        localStorage.setItem("gistId", id);
                        gistId = id;
                        gistFound(content, rssURL);
                        if (callback) callback();
                    });
                    if (callback) callback();
                }
            });
        } else {
            findGistId(pat, function(id) {
                if (id) {
                    findGist(pat, id, function(content, rssURL) {
                        gistFound(content, rssURL);
                        if (callback) callback();
                        resizeTextareas();
                    });
                } else {
                    createGist(pat, function(id, content, rssURL) {
                        localStorage.setItem("gistId", id);
                        gistId = id;
                        gistFound(content, rssURL);
                        if (callback) callback();
                    });
                }
            });
        }
    }
}
function gistFound(json, rssURL) {
    var container = document.querySelector(".container");
    container.innerHTML = '<button class="save-button">Save</button>';
    container.innerHTML += '<a target="_blank" href="'+rssURL+'"><button class="rss-link">RSS Link</button></a>';
    container.innerHTML += '<img src="logo.png" class="logo">';
    var gi = document.querySelector(".container-sample .general-info").cloneNode(true); // generalInfo
    var gio = json.generalInfo; // generalInfoObject
    var ia = json.items; // itemsArray
    container.appendChild(gi);
    gi.querySelector("input.title").value = gio.title;
    gi.querySelector("input.author").value = gio.author;
    gi.querySelector("input.subtitle").value = gio.subtitle;
    gi.querySelector("textarea.description").value = gio.description;
    gi.querySelector("input.url").value = gio.url;
    gi.querySelector("input.imageURL").value = gio.imageURL;
    gi.querySelector('select.language').value = gio.language;
    gi.querySelector('select.category').value = gio.category;
    gi.querySelector('select.explicit').value = gio.explicit;
    gi.querySelector("input.copyright").value = gio.copyright;
    gi.querySelector("input.name").value = gio.name;
    gi.querySelector("input.email").value = gio.email;
    for (var i = 0; i < json.items.length; i++) {
        var item = document.querySelector(".container-sample .item").cloneNode(true);
        container.appendChild(item);
        item.querySelector("input.guid").value          = ia[i].guid;
        item.querySelector("input.title").value         = ia[i].title;
        item.querySelector("h3.item-title").innerHTML   = ia[i].title;
        item.querySelector("input.audioURL").value      = ia[i].audioURL;
        item.querySelector("input.imageURL").value      = ia[i].imageURL;
        item.querySelector('select.explicit').value     = ia[i].explicit;
        item.querySelector("input.date").value          = ia[i].date;
        item.querySelector("input.duration").value      = ia[i].duration;
        item.querySelector("textarea.summary").value    = ia[i].summary;
    }
    resizeTextareas();
}

function save(callback) {
    var container = document.querySelector(".container");
    var gi = container.querySelector(".general-info"); // generalInfo
    var gio = {}; // generalInfoObject
    gio.title       = gi.querySelector("input.title").value;
    gio.author      = gi.querySelector("input.author").value;
    gio.subtitle    = gi.querySelector("input.subtitle").value;
    gio.description = gi.querySelector("textarea.description").value;
    gio.url         = gi.querySelector("input.url").value;
    gio.imageURL    = gi.querySelector("input.imageURL").value;
    gio.language    = gi.querySelector('select.language').value;
    gio.category    = gi.querySelector('select.category').value;
    gio.explicit    = gi.querySelector('select.explicit').value;
    gio.copyright   = gi.querySelector("input.copyright").value;
    gio.name        = gi.querySelector("input.name").value;
    gio.email       = gi.querySelector("input.email").value;

    var items = container.querySelectorAll(".item"); // generalInfo
    var ia = []; // itemsArray
    for (var i = 0; i < items.length; i++) {
        ia[i] = {};
        ia[i].guid      = items[i].querySelector("input.guid").value
        ia[i].title     = items[i].querySelector("input.title").value
        ia[i].title     = items[i].querySelector("h3.item-title").innerHTML
        ia[i].audioURL  = items[i].querySelector("input.audioURL").value
        ia[i].imageURL  = items[i].querySelector("input.imageURL").value
        ia[i].explicit  = items[i].querySelector('select.explicit').value
        ia[i].date      = items[i].querySelector("input.date").value
        ia[i].duration  = items[i].querySelector("input.duration").value
        ia[i].summary   = items[i].querySelector("textarea.summary").value
    }
    var json = {
        generalInfo: gio,
        items: ia
    };
    var xml = generateXML(json);
    updateGist(gistId, json, xml, function(id) {
        if (id) {
            console.log("saved");
            if (callback) callback(true);
        } else {
            console.log("not saved");
            if (callback) callback(false);
        }
    });
}

function updateGist(gistId, json, xml, callback) {
    var req = {
        files: {}
    };
    req.files[getFilename(pat).json] = {
        content: JSON.stringify(json)
    };
    req.files[getFilename(pat).rss] = {
        content: xml
    };
    xhr({
        url: "https://api.github.com/gists/"+gistId,
        auth: "token "+pat,
        type: "POST",
        json: req,
        onSuccess: function(res) {
            res = JSON.parse(res);
            console.log("----------------------------------- updateGist suc");
            console.log(res);
            callback(res.id, new Date(res.updated_at));
        },
        onError: function(res, code) {
            res = JSON.parse(res);
            console.log("----------------------------------- updateGist err");
            console.log(code);
            console.log(res);
            callback(false);
        }
    });
}

document.addEventListener("click", function(e) {
    if (e.target.classList.contains("save-button")) {
        e.target.classList.add("saving");
        e.target.innerHTML = "Saving...";
        save(function(success) {
            if (success) {
                e.target.classList.remove("saving");
                e.target.classList.add("saved");
                e.target.innerHTML = "Saved";
                setTimeout(function() {
                    e.target.classList.remove("saved");
                    e.target.innerHTML = "Save";
                },3000);
            } else {
                e.target.classList.remove("saving");
                e.target.classList.add("error");
                e.target.innerHTML = "Error saving :l";
            }
        });
    }
});

(function patDialog() {
    var button = document.querySelector("p.pat-button");
    var dialog = document.querySelector(".pat-dialog");
    var patInput = dialog.querySelector("input.pat");
    if (pat) patInput.value = pat;
    document.addEventListener("click", function(e) {
        if (e.target.classList.contains("pat-button")) {
            dialog.classList.add("visible");
        }
    });
    var saveButton = dialog.querySelector("button.save-pat");
    saveButton.addEventListener("click", function() {
        console.log("saving access token");
        // save personal access token
        pat = patInput.value;
        localStorage.setItem("pat", pat);
        jsonGistId = null;
        rssGistId = null;
        localStorage.removeItem("gistId");
        dialog.classList.add("saving");
        load(pat, function() {
            dialog.classList.remove("saving");
            dialog.classList.remove("visible");
        });
    });
    document.addEventListener("click", function(e) {
        if (e.target.classList.contains("dialog-container")) {
            e.target.classList.remove("visible");
        }
    });
})();

function findGist(pat, gistId, callback) {
    xhr({
        url: "https://api.github.com/gists/"+gistId,
        auth: "token "+pat,
        type: "GET",
        req: "",
        onSuccess: function(gist) {
            gist = JSON.parse(gist);
            console.log("----------------------------------- findGist suc");
            console.log(gist);
            var jsonFile = gist.files[getFilename(pat).json];
            var rssFile = gist.files[getFilename(pat).rss];
            callback(JSON.parse(jsonFile.content), rssFile.raw_url);
        },
        onError: function(res, code) {
            res = JSON.parse(res);
            console.log("----------------------------------- findGist err");
            console.log(code);
            console.log(res);
            callback(false);
        }
    });
}

function generateXML(json) {
    var xml = '';
    xml += '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">';
        xml += '<channel>';
            xml += '<title>'                +json.generalInfo.title+        '</title>';
            xml += '<itunes:author>'        +json.generalInfo.author+       '</itunes:author>';
            xml += '<itunes:subtitle>'      +json.generalInfo.subtitle+     '</itunes:subtitle>';
            xml += '<description>'          +json.generalInfo.description+  '</description>';
            xml += '<link>'                 +json.generalInfo.link+         '</link>';
            xml += '<itunes:image href="'   +json.generalInfo.imageURL+     '"/>';
            xml += '<language>'             +json.generalInfo.language+     '</language>';
            xml += '<itunes:category text="'+json.generalInfo.category+     '"/>';
            xml += '<itunes:explicit>'      +json.generalInfo.explicit+     '</itunes:itunes:explicit>';
            xml += '<copyright>'            +json.generalInfo.copyright+    '</copyright>';
            xml += '<itunes:owner>';
                xml += '<itunes:name>'          +json.generalInfo.name+         '</itunes:name>';
                xml += '<itunes:email>'         +json.generalInfo.email+        '</itunes:email>';
            xml += '</itunes:owner>';

            console.log(json.items);
            for (var i = 0; i < json.items.length; i++) {
                xml += '<item>';
                    xml += '<guid>'                             +json.items[i].guid+            '</guid>';
                    xml += '<title>'                            +json.items[i].title+           '</title>';
                    xml += '<enclosure type="audio/mpeg" url="' +json.items[i].audioURL+        '" length="0"/>';
                    xml += '<itunes:image href="'               +json.items[i].imageURL+        '"/>';
                    xml += '<itunes:explicit>'                  +json.items[i].explicit+        '</itunes:explicit>';
                    xml += '<pubDate>'                          +json.items[i].date+            '</pubDate>';
                    xml += '<itunes:duration>'                  +json.items[i].duration+        '</itunes:duration>';
                    xml += '<itunes:summary>'                   +json.items[i].summary+         '</itunes:summary>';
                xml += '</item>';
            }
        xml += '</channel>';
    xml += '</rss>';
    return xml;
}

function createGist(pat, callback) {
    var req = {
        description: "RSS Gist created by LaRSS",
        files: {}
    };
    var defaultJSON = {
        generalInfo: {
            title: "",
            author: "",
            subtitle: "",
            description: "",
            url: "",
            imageURL: "",
            explicit: "no",
            language: "en-us",
            category: "Music",
            copyright: "",
            name: "",
            email: ""
        },
        items: [
            {
                guid: "",
                title: "New Item",
                audioURL: "",
                imageURL: "",
                explicit: "no",
                date: "Wed, 25 Oct 2017 22:00:00 CET",
                duration: "",
                summary: ""
            }
        ]
    };
    req.files[getFilename(pat).json] = {
        content: JSON.stringify(defaultJSON)
    };
    req.files[getFilename(pat).rss] = {
        content: "empty rn"
    };
    xhr({
        url: "https://api.github.com/gists",
        auth: "token "+pat,
        type: "POST",
        json: req,
        onSuccess: function(res) {
            res = JSON.parse(res);
            console.log("----------------------------------- createGist suc");
            console.log(res);
            var rssFile = gist.files[getFilename(pat).rss];
            callback(res.id, defaultJSON, rssFile.raw_url);
        },
        onError: function(res, code) {
            res = JSON.parse(res);
            console.log("----------------------------------- createGist err");
            console.log(code);
            console.log(res);
        }
    });
}

function findGistId(pat, callback) {
    xhr({
        url: "https://api.github.com/gists/"+gistId,
        auth: "token "+pat,
        type: "GET",
        req: "",
        onSuccess: function(gists) {
            gists = JSON.parse(gists);
            console.log("----------------------------------- findgistid suc");
            console.log(gists);
            for (var i = 0; i < gists.length; i++) {
                if (gist[i].files[getFilename(pat).json]) {
                    callback(gists[i].id);
                    return;
                }
            }
            callback(false);
        },
        onError: function(res, code) {
            res = JSON.parse(res);
            console.log("----------------------------------- findgistid err");
            console.log(code);
            console.log(res);
            callback(false);
        }
    });
}

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
        json: "larss-"+pat.slice(0,4)+".json",
        rss: "larss-"+pat.slice(0,4)+".rss"
    };
}

load(pat);
function load(pat, callback) {
    if (pat) {
        // if gistId is already saved, load it. Otherwise, find the gistId
        if (gistId) {
            findGist(pat, gistId, function(content) {
                // if the gist was found, load it. Otherwise
                if (content) {
                    gistFound(content);
                    if (callback) callback();
                } else {
                    createGist(pat, function(id, content) {
                        localStorage.setItem("gistId", id);
                        gistId = id;
                        gistFound(content);
                        if (callback) callback();
                    });
                    if (callback) callback();
                }
            });
        } else {
            findGistId(pat, function(id) {
                if (id) {
                    findGist(pat, id, function(content) {
                        gistFound(content);
                        if (callback) callback();
                        resizeTextareas();
                    });
                } else {
                    createGist(pat, function(id, content) {
                        localStorage.setItem("gistId", id);
                        gistId = id;
                        gistFound(content);
                        if (callback) callback();
                    });
                }
            });
        }
    }
}
function gistFound(json, updatedAt) {
    var container = document.querySelector(".container");
    container.innerHTML = '<img src="logo.png" class="logo">';
    var generalInfo = document.querySelector(".container-sample .general-info").cloneNode(true);
    var gio = json.generalInfo; // generalInfoObject
    var io = json.items; // generalInfoObject
    container.appendChild(generalInfo);
    generalInfo.querySelector("input.title").value = gio.title;
    generalInfo.querySelector("input.author").value = gio.author;
    generalInfo.querySelector("input.subtitle").value = gio.subtitle;
    generalInfo.querySelector("textarea.description").value = gio.description;
    generalInfo.querySelector("input.url").value = gio.url;
    generalInfo.querySelector("input.imageURL").value = gio.imageURL;
    generalInfo.querySelector('select.language').value = gio.language;
    generalInfo.querySelector('select.category').value = gio.category;
    generalInfo.querySelector('select.explicit').value = gio.explicit;
    generalInfo.querySelector("input.copyright").value = gio.copyright;
    generalInfo.querySelector("input.name").value = gio.name;
    generalInfo.querySelector("input.email").value = gio.email;
    for (var i = 0; i < json.items.length; i++) {
        var itemSample = document.querySelector(".container-sample .item").cloneNode(true);
        container.appendChild(itemSample);
        itemSample.querySelector("input.guid").value = io[i].guid;
        itemSample.querySelector("input.title").value = io[i].title;
        itemSample.querySelector("input.audioURL").value = io[i].audioURL;
        itemSample.querySelector("input.imageURL").value = io[i].imageURL;
        itemSample.querySelector('select.explicit').value = io[i].explicit;
        itemSample.querySelector("input.date").value = io[i].date;
        itemSample.querySelector("input.duration").value = io[i].duration;
        itemSample.querySelector("textarea.summary").value = io[i].summary;
    }
    resizeTextareas();
}

(function patDialog() {
    var button = document.querySelector("p.pat-button");
    var dialog = document.querySelector(".pat-dialog");
    var patInput = dialog.querySelector("input.pat");
    if (pat) pat.value = pat;
    button.addEventListener("click", function() {
        dialog.classList.add("visible");
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
            callback(JSON.parse(jsonFile.content), new Date(gist.updated_at));
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
    function add(index, tag) {
        if (tag.startsWith("itunes:")) var prop = tag.slice(7);
        else var prop = tag;
        if (index == "generalInfo") {
            var value = json.generalInfo[prop];
        } else {
            var value = json.items[index][prop];
        }
        xml += '<'+tag+'>'+value+'</'+tag+'>';
    }
    xml += '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">';
        xml += '<channel>';
            add("generalInfo", "title");
            add("generalInfo", "itunes:author");
            add("generalInfo", "itunes:subtitle");
            add("generalInfo", "description");
            add("generalInfo", "link");
            xml += '<itunes:image href="'+json.generalInfo.imageURL+'"/>';
            add("generalInfo", "language");
            xml += '<itunes:category text="'+json.generalInfo.category+'"/>';
            add("generalInfo", "itunes:explicit");
            add("generalInfo", "copyright");
            xml += '<itunes:owner>';
                add("generalInfo", "itunes:name");
                add("generalInfo", "itunes:email");
            xml += '</itunes:owner>';

            for (var i = 0; i > json.items.length; i++) {
                xml += '<item>';
                    add(i, "guid");
                    add(i, "title");
                    xml += '<enclosure type="audio/mpeg" url="'+json.items[i].audioURL+'" length="0"/>';
                    xml += '<itunes:image href="'+json.items[i].imageURL+'"/>';
                    add(i, "itunes:explicit");
                    add(i, "pubDate");
                    add(i, "itunes:duration");
                    add(i, "itunes:summary");
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
                title: "",
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
            callback(res.id, defaultJSON, new Date(res.updated_at));
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

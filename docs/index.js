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
function getFilename(pat) {
    return {
        json: "larss-"+pat.slice(0,4)+".json",
        rss: "larss-"+pat.slice(0,4)+".rss"
    };
}

function loadFeed(callback) {
    if (pat) {

    }
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
        pat = pat.value;
        localStorage.setItem("pat", pat);
        jsonGistId = null;
        rssGistId = null;
        gistDate = null;
        localStorage.removeItem("gistId");
        localStorage.removeItem("gistDate");
        dialog.classList.add("saving");
        reloadTasks(function() {
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
            callback(JSON.parse(jsonFile.content), JSON.parse(rssFile.content), new Date(gist.updated_at));
        },
        onError: function(res, code) {
            res = JSON.parse(res);
            console.log("----------------------------------- findGist err");
            console.log(code);
            console.log(res);
        }
    });
}

function createGist(pat, callback) {
    var req = {
        description: "RSS Gist created by LaRSS",
        files: {}
    };
    req.files[getFilename(pat).json] = {
        content: JSON.stringify(json)
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
            callback(res.id, new Date(res.updated_at));
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
        }
    });
}

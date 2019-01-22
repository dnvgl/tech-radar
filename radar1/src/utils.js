function createMailto(email, name, subject) {
    return $("<a>").text(name).attr("href", "mailto:" + email + "&subject=" + subject);
}

function getSelected(id) {
    var e = $(id);
    if (!e.length) return null;
    var selected = [];
    e.children(".active").each(function () {
        selected.push($(this).attr("value"))
    });
    return selected;
}

function initTabs(e) {
    function _togglePanels() {
        // for each link element, find the corresponding panel (given in the href attribute) and show it if the .nav-link has class "active"
        $(e).each(function () {
            let tabId = $(this).attr("href");
            $(tabId).toggle($(this).hasClass("active"))
        });
    }

    _togglePanels();

    $(e).click(function () {
        // remove active from the currently active nav-link
        $(e).removeClass("active");
        // add active to the clicked nav-link
        $(this).addClass("active");

        // show/hide panels accordingly
        _togglePanels();
        return false;
    });
}

function toClassName(name) {
    return name.toLowerCase().replace(/&/g,"and").replace(/ /g, "_");
}

function random(min, max) {
    return min + Math.random() * (max - min);
}

function simplify(txt) {
    return txt.replace(/[\s\.\-\_\/]/gi, '').toLowerCase();
}

function toCartesian(r, angle) {
    var phi = angle / 180 * Math.PI;
    var x = r * Math.sin(phi);
    var y = -r * Math.cos(phi);
    return {
        x: x,
        y: y
    };
}

function toPolar(x, y) {
    var angle = Math.atan2(x, -y) / Math.PI * 180;
    while (angle < 0) angle += 360;
    angle %= 360;
    return {
        angle: angle,
        r: Math.sqrt(x * x + y * y)
    }
}

function get(url, action) {
    var xhr = new XMLHttpRequest();
    xhr.async = true;
    xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
            action(JSON.parse(xhr.responseText));
        } else {
            console.log(xhr.responseText);
        }
    }

    xhr.open('GET', url);
    xhr.send();
}
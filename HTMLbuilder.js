function makeSigmaHtmlPlusElement(elem) {
    elem.child = function (type) {
        var childElem = makeSigmaHtmlPlusElement(document.createElement(type));
        elem.appendChild(childElem)
        return childElem;
    }
    elem.html = function (html) {
        elem.innerHTML = html;
        return elem;
    }
    elem.setText = function (text) {
        elem.innerText = text;
        return elem;
    }
    elem.attr = function (attribute, value) {
        elem.setAttribute(attribute, value);
        return elem;
    }
    elem.class = function (className) {
        elem.classList.add(className)
        return elem;
    }
    // elem.do = function (a, params) {
    //     elem.a(...params)
    //     return elem;
    // }
    elem.ev = function (event, listener) {
        elem.addEventListener(event, listener)
        return elem;
    }
    elem.up = function () {
        return elem.parentElement
    }
    elem.for = function (array, func) {
        for (var i = 0; i < array.length; i++) {
            var element = array[i];
            elem.appendChild(func(element))
        }
        return elem
    }
    return elem;
}

/**
 * @param {String} type HTML element type
 */
function make(type) {
    return makeSigmaHtmlPlusElement(document.createElement(type));
}

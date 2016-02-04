if (typeof Qt != "undefined") {
  Qt.include("common.js");
}

var PARAM_SEP = "&";
var PARAM_EQ = "=";

function encodeQueryParams(params, sep, eq) {
  sep = sep || PARAM_SEP;
  eq = eq || PARAM_EQ;
  var pairs = [];
  for (var i in params) {
    if (params.hasOwnProperty(i)) {
      var name = encodeURIComponent(i); 
      var value = encodeURIComponent(params[i]);
      pairs.push(name + eq + value);
    }
  }
  return pairs.join(sep);
}

function parseQueryString(str, sep, eq) {
  sep = sep || PARAM_SEP;
  eq = eq || PARAM_EQ;
  var pairs = str.split(sep);
  var ret = {};
  for (var i = 0; i < pairs.length; ++i) {
    var pair = pairs[i].split(eq);
    var name = decodeURIComponent(pair[0]);
    var value = pair.length > 1 ? decodeURIComponent(pair[1]) : '';
    ret[name] = value;
  }
  return ret;
}

/**
 * Sends http request 
 *
 * @param method {string}
 * @param url {string}
 * @param callback {function}
 * @param options.context {object}
 * @param options.data {object}
 * @param options.headers {object}
 * @param options.params {object}
 */
function sendRequest(method, url, callback, options) {
  options = options || {};
  if (options.params) {
    var params = encodeQueryParams(options.params);
    url += (url.indexOf('?') == -1 ? '?' : '&') + params;
  }
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    if (typeof callback == "function") {
      try {
        var response = JSON.parse(this.responseText);
      } catch (e) {
        var response = this.responseText;
      }
      callback.call(options.context, response, this.status, this);
    }
  };
  xhr.open(method.toUpperCase(), url);
  var contentTypeSet = false;
  if (options.headers) {
    var headers = options.headers;
    for (var i in headers) {
      if (headers.hasOwnProperty(i)) {
        if (!contentTypeSet && i.toLowerCase() == "content-type") {
          contentTypeSet = true;
        } 
        xhr.setRequestHeader(i, headers[i]);
      }
    }
  }
  // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
  // void send();
  // void send(ArrayBufferView data);
  // void send(Blob data);
  // void send(Document data);
  // void send(DOMString? data);
  // void send(FormData data);
  var data = options.data;
  if ({}.toString.call(data) == '[object Object]') {
    data = encodeQueryParams(data);
    if (!contentTypeSet) {
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    }
  }
  xhr.send(data);
}

/**
 * get('http://httpbin.org/get', (q) => console.log(q.args), {foo: "bar"})
 */
function get(url, callback, params, options) {
  options = extend({}, options);
  options.params = params;
  sendRequest("GET", url, callback, options);
}

/**
 * post('http://httpbin.org/post', {foo: "bar"}, (q) => console.log(q.form))
 */
function post(url, data, callback, options) {
  options = extend({}, options);
  options.data = data;
  sendRequest("POST", url, callback, options);
}

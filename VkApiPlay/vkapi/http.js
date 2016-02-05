var PARAM_SEP = "&";
var PARAM_EQ = "=";

function encodeQueryParams(params, sep, eq) {
  sep = sep || PARAM_SEP;
  eq = eq || PARAM_EQ;
  return Object.keys(params).map(function(key) {
    return encodeURIComponent(key) + eq + encodeURIComponent(params[key]);
  }).join(sep);
}

function parseQueryString(str, sep, eq) {
  sep = sep || PARAM_SEP;
  eq = eq || PARAM_EQ;
  var params = str.split(sep);
  var ret = {};
  for (var i = 0; i < params.length; ++i) {
    var param = params[i].split(eq);
    var key = decodeURIComponent(param[0]);
    var value = param[1] !== undefined ? decodeURIComponent(param[1]) : "";
    ret[key] = value;
  }
  return ret;
}

function sendRequest(method, url, callback, data, query) {
  var request = new XMLHttpRequest();
  if (query) {
    query = encodeQueryParams(query);
    url += (url.indexOf('?') == -1 ? '?' : '&') + query;
  }
  request.open(method.toUpperCase(), url);
  request.onload = function() {
    if (typeof callback == "function") {
      try {
        var data = JSON.parse(this.responseText);
      } catch (e) {
        var data = this.responseText;
      }
      callback(data, this);
    }
  };
  if (data) {
    data = encodeQueryParams(data);
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  }
  request.send(data);
}

/**
 * sendGetRequest('http://httpbin.org/get', (q) => console.log(q.args), {foo: "bar"})
 */
function sendGetRequest(url, callback, query) {
  sendRequest('GET', url, callback, null, query);
}

/**
 * sendPostRequest('http://httpbin.org/post', (q) => console.log(q.form), {foo: "bar"})
 * var fd = new FormData; fd.append('foo', 'bar'); sendPostRequest('http://httpbin.org/post', (q) => console.log(q.form), fd)
 */
function sendPostRequest(url, callback, data, query) {
  sendRequest('POST', url, callback, data, query);
}

function clone(obj) {
  if (obj == null || typeof obj != "object") {
    return obj;
  }
  var copy = obj.constructor();
  for (var i in obj) {
    copy[i] = clone(obj[i]);
  }
  return copy;
}

// extend(obj, src[, src1[, ...]])
function extend(obj) {
  [].slice.call(arguments, 1).forEach(function(src) {
    // Не убирать эту проверку или все сломается
    if (!src) {
      return;
    }
    Object.keys(src).forEach(function(key) {
      obj[key] = src[key];
    });
  });
  return obj;
}

function each(obj, cb, context) {
  if (!obj) {
    return;
  }
  if (obj.length) {
    for (var i = 0, l = obj.length; i < l; ++i) {
      if (cb.call(context, obj[i], i, obj) === false) {
        break;
      }
    }
  } else {
    for (var i in obj) {
      if (obj.hasOwnProperty(i)) {
        if (cb.call(context, obj[i], i, obj) === false) {
          break;
        }
      }
    }
  }
}

function formatStr(str) {
  var args = [].slice.call(arguments, 1);
  return str.replace(/\{(\d+)\}/g, function(match, index) {
    return typeof args[index] != "undefined" ? args[index] : match;
  });
}

// template("Hello {user.name}!", {user: {name: 'Foo'}})
// template("Hello {users.0}!", {users: ['Foo', 'Bar']})
// template("Hello {users[0]}!", {users: ['Foo', 'Bar']}
function template(str, obj) {
  return str.replace(/\{(.*?)\}/g, function(match, key) {
    key = key.replace(/\[(.*?)\]/g, '.$1');
    var names = key.split('.');
    var cur = obj;
    while (names.length) {
      var name = names.shift();
      if (cur.hasOwnProperty(name)) {
        cur = cur[name];
      } else {
        return match;
      }
    }
    return cur;
  });
}

var PARAM_SEP = "&";
var PARAM_EQ = "=";

function encodeQueryParams(params, sep, eq) {
  sep = sep || PARAM_SEP;
  eq = eq || PARAM_EQ;
  var query = [];
  return Object.keys(params).map(function(key) {
    return encodeURIComponent(key) + eq + encodeURIComponent(params[key]);
  }).join(sep);
}

function parseQueryString(str, sep, eq) {
  sep = sep || PARAM_SEP;
  eq = eq || PARAM_EQ;
  var params = str.split(sep);
  var ret = {};
  each(params, function(param) {
    var sp = param.split(eq);
    if (sp.length) {
      var key = decodeURIComponent(sp[0]);
      if (typeof sp[1] != "undefined") {
        var val = sp[1];
        // if (isNaN(val)) {
        //   ret[key] = decodeURIComponent(val);
        // } else {
        //   ret[key] = parseInt(val);
        // }
        ret[key] = decodeURIComponent(val);
      } else {
        ret[key] = '';
      }
    } 
  })
  return ret;
}

// Сценарии VkScript удобно хранить в теле функций
function toVkScript(fn, replacements) {
  // Символ @ является невалидным, поэтому мы его заменяем шаблоном ($at)
  replacements = extend({at: '@'}, replacements);
  var code = fn.toString().replace(/^.*?\{|\}$/g, '');
  for (var i in replacements) {
    if (replacements.hasOwnProperty(i)) {
      var re = RegExp('\\(\\$' + i + '\\)', 'g');
      code = code.replace(re, replacements[i]);
    }
  }
  return code;
}

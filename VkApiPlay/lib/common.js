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
    if (src == null) {
      return;
    }
    Object.keys(src).forEach(function(key) {
      obj[key] = src[key];
    });
  });
  return obj;
}

function each(obj, cb, context) {
  if (obj == null) {
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

// Данную функцию я где-то давно подсмотрел
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

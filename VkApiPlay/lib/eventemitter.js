//
// @author Sergei Snegirev (tz4678@gmail.com)
//

/**
 * EventEmitter constructor
 */
function EventEmitter() {
  this._listeners = {};
}

EventEmitter.prototype = {
  /**
   * Add event listener
   *
   * @param event {string}
   * @param fn {function}
   * @param context {object} (optional)
   * @param once {boolean} (optional)
   * @return {this}
   */
  on: function(event, fn, context, once) {
    (this._hasOwn(event) ? this._listeners[event] :
      this._listeners[event] = []).push({
      fn: fn,
      context: context != null ? context : this,
      once: once
    });
    return this;
  },
  /**
   * Add one-shot event listener
   *
   * @param event {string}
   * @param fn {function}
   * @param context {object} (optional)
   * @return {this}
   */
  once: function(event, fn, context) {
    return this.on(event, fn, context, true);
  },
  /**
   * Remove event listeners
   *
   *
   * @param event {string} (optional)
   * @param fn {function} (optional)
   * @param context {object} (optional)
   * @return {this}
   */
  off: function(event, fn, context) {
    if (!arguments.length) {
      // .off() remove all listeners
      this._listeners = {};
    } else if (arguments.length == 1) {
      // .off(event) remove all listeners for event
      if (this._hasOwn(event)) {
        delete this._listeners[event];
      }
    } else {
      // .off(event, fn[, context]) remove all listeners fn for event or
      // remove all listeners fn for event in the context
      if (this._hasOwn(event)) {
        var listeners = this._listeners[event];
        var i = 0;
        while (i < listeners.length) {
          var listener = listeners[i];
          if (fn === listener.fn && (context == null ||
              context === listener.context)) {
            listeners.splice(i, 1);
          } else {
            ++i
          }
        }
        if (!listeners.length) {
          delete this._listeners[event];
        }
      }
    }
    return this;
  },
  /**
   * Emit event
   *
   * .emit(event[, arg1[, arg2[, ...]]])
   *
   * @param event {string}
   * @param *args
   */
  emit: function(event, args) {
    if (!this._hasOwn(event)) {
      return;
    }
    args = [].slice.call(arguments, 1);
    var listeners = this._listeners[event];
    var i = 0;
    while (i < listeners.length) {
      var listener = listeners[i];
      listener.fn.apply(listener.context, args)
      if (listener.once) {
        listeners.splice(i, 1);
      } else {
        ++i
      }
    }
    if (!listeners.length) {
      delete this._listeners[event];
    }

  },
  _hasOwn: function(event) {
    return this._listeners.hasOwnProperty(event);
  }
};

/**
 * Add mixin to obj 
 *
 * @param obj {object}
 * @return {object}
 */
EventEmitter.mixin = function(obj) {
  if (typeof obj == "function") {
    obj = obj.prototype;
  }
  var proto = new EventEmitter();
  for (var i in proto) {
    obj[i] = proto[i];
  }
  return obj;
};
/*
EventEmitter.mixin(Foo);
var foo = new Foo();
foo.on("test", () => console.log("It's works!"));
foo.emit("test");
*/

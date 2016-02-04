if (typeof Qt != "undefined") {
  Qt.include("common.js");
  Qt.include("http.js");
  Qt.include("eventemitter.js");
  var md5 = Qt.md5;
}

if (typeof md5 != "function") {
  function md5() {
    throw new Error("MD5 encoding not supported!");
  }
}

var API_HOST = "api.vk.com";
var API_PATH = "/method/";
var API_DELAY = 334;

function Api(options) {
  options = options || {};
  this.token = options.token;
  // Дополнительные параметры, которые добавляются к каждому запросу, например,
  // {lang: 'en', https: 1} - возвращаем имена на английском и ссылки на
  // изображения начинающиеся с https вместо http
  this.extraParams = options.extraParams;
  this.version = options.version;
  this.delay = options.delay || API_DELAY;
}

Api.prototype = {
  request: null,
  requestQueue: [],
  requestTime: 0,
  waiting: false,

  call: function(method, params, options) {
     var request = new ApiRequest(this, method, params, options);
     this.requestQueue.push(request);
     this.processRequestQueue();
  },

  execute: function(code, options) {
    this.call('execute', {code: code}, options);
  },

  cancelAllRequests: function() {
    console.log("Cancel all requests");
    this.requestQueue = [];
    this.waiting = false;
  },

  nextRequest: function() {
    this.waiting = false;
    this.processRequestQueue();
  },

  processRequestQueue: function() {
    if (this.waiting) {
      console.log("Waiting...");
      return;
    }
    // Сохраняем запрос, нам еще может понадобиться его выполнить еще раз
    var request = this.request = this.requestQueue.shift();
    if (request) {
      request.send();
    } else {
      console.log("Queue empty");
    }
  },
};

EventEmitter.mixin(Api);

function ApiRequest(api, method, params, options) {
  this.api = api;
  this.method = method;
  this.params = extend({}, params);
  options = options || {};
  this.done = options.done;
  this.fail = options.fail;
  this.context = options.context;
  this.delay = options.delay || this.api.delay;
}

ApiRequest.prototype = {
  processResponse: true,

  send: function() {
    console.log("Send request");
    var t = this;
    t.api.waiting = true;
    // console.log(t.params);
    var params = extend({}, t.api.extraParams, t.params);
    // console.log(params);
    if (t.api.version) {
      params.v = t.api.version;
    }

    var scheme = "https";
    if (t.api.token) {
      params.access_token = t.api.token.accessToken;
      if (this.api.token.secret) {
        // https://vk.com/dev/api_nohttps
        scheme = "http";
        if (params.sig) {
          delete params.sig;
        }
        var str = formatStr(
          "{0}{1}?{2}{3}",
          API_PATH,
          t.method,
          encodeQueryParams(params),
          t.api.token.secret
        );
        params.sig = md5(str);
      }
    }

    var format = "{0}://{1}{2}{3}";
    var endpoint = formatStr(format, scheme, API_HOST, API_PATH, t.method);
    var nextRequestTime = t.api.requestTime + t.delay;
    var now = Date.now();
    var timeout = nextRequestTime > now ? nextRequestTime - now : 0;
    console.log("timeout = %sms", timeout);
    setTimeout(function() {
      post(endpoint, params, function(data) {
        t.api.requestTime = Date.now();
        var error = data.error;
        var response = data.response;
        if (error) {
          console.error(t.formatError(error));
          t.api.emit('error', error);
        }
        // Мы можем отменить обработку запроса
        if (t.processResponse) {
          if (error && typeof t.fail == "function") {
            t.fail.call(t.context, error);
          } else if (typeof t.done == "function") {
            t.done.call(t.context, response);
          }
          t.next();
        }
      });
    }, timeout);
  },

  // Переходит к следующему запросу в очереди
  next: function() {
    this.api.nextRequest();
  },

  // Повторить запрос через миллисекунд
  retry: function(timeout) {
    var t = this;
    t.processResponse = true;
    setTimeout(function() {
      t.send();
    }, timeout || 0);
  },

  formatError: function(error) {
    var params = {};
    for (var i = 0; i < error.request_params.length; ++i) {
      params[error.request_params[i].key] = error.request_params[i].value;
    }
    var method = params.method;
    delete params.method;
    return template(
      '[Error Code: {code}, Message: {msg}]' +
      ' An error occurred while calling method "{method}"' +
      ' with parameters: {params}',
      {
        code: error.error_code,
        msg: error.error_msg,
        method: method,
        params: this.formatParams(params)
      }
    );
  },

  formatParams: function(params) {
    return JSON.stringify(params, function(k, v) {
      if (k == "access_token") {
        return "**CENSORED**";
      }
      return v;
    });
  },
};

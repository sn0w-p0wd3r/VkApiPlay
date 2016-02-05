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
  var t = this;
  t.accessToken = options.accessToken;
  // Дополнительные параметры, которые добавляются к каждому запросу, например,
  // {lang: 'en', https: 1} - возвращаем имена на английском и ссылки на
  // изображения начинающиеся с https вместо http
  t.extraParams = options.extraParams;
  t.version = options.version;
  t.delay = options.delay || API_DELAY;
}

Api.prototype = {
  request: null,
  requestQueue: [],
  requestTime: 0,
  waiting: false,

  call: function(method, callback, params, delay) {
    var request = new ApiRequest(this, method, callback, params, delay);
    this.requestQueue.push(request);
    this.processRequestQueue();
  },

  execute: function(code, callback, delay) {
    this.call('execute', callback, {code: code}, delay);
  },

  testAccessToken: function(callback, delay) {
    this.execute('', function(error) {
      if (typeof callback == "function") {
        callback(error === undefined);
      }
    }, delay);
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

function ApiRequest(api, method, callback, params, delay) {
  var t = this;
  t.api = api;
  t.method = method;
  t.callback = callback;
  t.params = extend({}, params);
  t.delay = delay || api.delay;
}

ApiRequest.prototype = {
  send: function(delay) {
    console.log("Send request");
    var t = this;
    delay = delay || t.delay;
    t.api.waiting = true;
    var params = {};
    if (t.api.version) {
      params.v = t.api.version;
    }
    // console.log(t.params);
    extend(params, t.api.extraParams, t.params);
    // console.log(params);

    var scheme = "https";
    if (t.api.accessToken) {
      params.access_token = t.api.accessToken.accessToken;
      if (t.api.accessToken.secret) {
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
          t.api.accessToken.secret
        );
        params.sig = md5(str);
      }
    }

    var format = "{0}://{1}{2}{3}";
    var endpoint = formatStr(format, scheme, API_HOST, API_PATH, t.method);
    var nextRequestTime = t.api.requestTime + delay;
    var now = Date.now();
    var timeout = nextRequestTime > now ? nextRequestTime - now : 0;
    console.log("timeout = %sms", timeout);
    setTimeout(function() {
      sendPostRequest(endpoint, function(response) {
        t.api.requestTime = Date.now();
        var error = response.error;
        t._processing = true;
        if (error) {
          error = new ApiError(error);
          t.api.emit('error', error);
        }
        // Можно отменить обработку
        if (t._processing) {
          if (typeof t.callback == "function") {
            t.callback(error, response.response);
          }
          t.next();
        }
      }, params);
    }, timeout);
  },

  // Переходит к следующему запросу в очереди
  next: function() {
    this.api.nextRequest();
  },

  // Я не знаю как назвать эту функцию
  // Отменяет обработку текущей ошибки и прекращает обработку всех запросов 
  stopProcessing: function() {
    this._processing = false;
  },
};

function ApiError(data) {
  var t = this;
  t.name = "ApiError";
  t.code = data.error_code;
  var params = {};
  for (var i = 0; i < data.request_params.length; ++i) {
    params[data.request_params[i].key] = data.request_params[i].value;
  }
  var method = params.method;
  delete params.method;
  // Что это такое мне неизвестно
  // delete params.oauth;
  t.message = template(
    '[Error Code: {code}, Message: {msg}]' +
    ' An error occurred while calling method "{method}"' +
    ' with parameters: {params}',
    {
      code: t.code,
      msg: data.error_msg,
      method: method,
      params: JSON.stringify(params)
    }
  );
}

ApiError.prototype = Error.prototype;

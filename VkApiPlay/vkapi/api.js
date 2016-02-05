if (typeof Qt != "undefined") {
  Qt.include("utils.js");
  Qt.include("eventemitter.js");
  var md5 = Qt.md5;
}

if (typeof md5 != "function") {
  function md5() {
    throw new Error("MD5 not supported");
  }
}

var API_VERSION = 5.44;
var API_DELAY = 334;
var API_HOST = "api.vk.com";
var API_PATH = "/method/";

function ApiClient(options) {
  var t = this;
  options = options || {};
  t.accessToken = options.accessToken;
  t.apiVersion = options.apiVersion || API_VERSION;
  t.apiDelay = options.apiDelay || API_DELAY;
  t.apiHost = options.apiHost || API_HOST;
  t.apiPath = options.apiPath || API_PATH;
  // {http: 1, lang: 'en'}
  t.apiParams = options.apiParams;
}

ApiClient.prototype = {
  apiQueue: [],
  apiRequestTime: 0,
  processing: true,

  /**
   * Добавляет запрос к Api в очередь
   *
   * Аргументы после метода могут передаваться в произвольном порядке.
   *
   * @param method {string} Название метода 
   * @param callback {function} Функция обработчик function(error, response) 
   * @param params {object} 
   * @param delay {number} 
   */
  api: function(method) {
    var t = this;
    var args = [].slice.call(arguments, 1, 4);
    var callback;
    var params;
    var delay;

    while (args.length) {
      var arg = args.shift()
      if (typeof arg == "function" &&
          typeof callback == "undefined") {
        callback = arg;
      } else if (typeof arg == "object" &&
          typeof params == "undefined") {
        params = arg;
      } else if (typeof arg == "number" &&
          typeof delay == "undefined") {
        delay = arg;
      }
    }

    var request = new ApiRequest(method, callback, params, delay);
    // console.log(t);
    
    t.apiQueue.push(request);

    if (t.processing) {
      t.processApiQueue();
    }
  },

  execute: function(code, callbackOrDelay, delayOrCallback) {
    this.api('execute', {code: code}, callbackOrDelay, delayOrCallback);
  },

  testAccessToken: function(callback, delay) {
    this.execute('', function(error) {
      callback(error === undefined);
    }, delay);
  },

  cancelApiRequests: function() {
    this.apiQueue = [];
    this.processing = true;
  },

  processApiQueue: function() {
    var t = this;
    var request = t.apiRequest = t.apiQueue.shift();
    console.log("Process api request");
    console.log(request);
    if (request) {
      t.processApiRequest();
    } else {
      console.log("Api queue is empty");
    }
  },

  processApiRequest: function() {
    console.log("Process current api request");
    var t = this;
    t.processing = false;
    var params = {};
    if (t.apiVersion) {
      params.v = t.apiVersion;
    }
    extend(params, t.apiParams, t.apiRequest.params);

    var scheme = "https";
    if (t.accessToken) {
      params.access_token = t.accessToken.accessToken;
      if (t.accessToken.secret) {
        // https://vk.com/dev/api_nohttps
        scheme = "http";

        if (params.sig) {
          delete params.sig;
        }

        var str = formatStr(
          "{0}{1}?{2}{3}",
          t.apiPath,
          request.method,
          encodeQueryParams(params),
          t.accessToken.secret
        );

        params.sig = md5(str);
      }
    } // end if t.accessToken

    var endpoint = formatStr(
      "{0}://{1}{2}{3}",
      scheme,
      t.apiHost,
      t.apiPath,
      t.apiRequest.method
    );

    var nextRequestTime = t.apiRequestTime + (t.apiRequest.delay || t.apiDelay);
    var now = Date.now();
    var timeout = nextRequestTime > now ? nextRequestTime - now : 0;
    console.log("timeout = %sms", timeout);

    setTimeout(function() {
      t.sendPostRequest(endpoint, function(response) {
        t.processing = true;
        t.apiRequestTime = Date.now();
        var error = response.error;
        if (error) {
          error = new ApiError(error);
          t.emit('error', error);
        }
        console.log("this.apiRequest:");
        console.log(t.apiRequest);
        // Можно отменить обработку
        if (t.processing) {
          if (typeof t.apiRequest.callback == "function") {
            t.apiRequest.callback(error, response.response);
          }
          t.processApiQueue();
        }
      }, params);
    }, timeout);
  }, // end function processApiRequest

  sendRequest: function(method, url, callback, data) {
    var xhr = new XMLHttpRequest;
    xhr.open(method.toUpperCase(), url);
    xhr.responseType = "json";
    xhr.onload = function() {
      if (typeof callback == "function") {
        // null or this?
        callback(this.response, this);
      }
    };
    if (data) {
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      data = encodeQueryParams(data);
    }
    xhr.send(data);
  },

  sendGetRequest: function(url, callback, params) {
    if (params) {
      params = encodeQueryParams(params);
      url += (url.indexOf('?') == -1 ? '?' : '&') + params;
    }
    this.sendRequest('get', url, callback);
  },

  sendPostRequest: function(url, callback, data) {
    this.sendRequest('post', url, callback, data);
  }
};

EventEmitter.mixin(ApiClient);

function ApiRequest(method, callback, params, delay) {
  var t = this;
  t.method = method;
  t.callback = callback;
  t.params = extend({}, params);
  t.delay = delay;
}

function ApiError(data) {
  var t = this;
  t.name = "ApiError";
  t.errorCode = data.error_code;
  t.errorMsg = data.error_msg;
  t.captchaSid = data.captcha_sid;
  t.captchaImg = data.captcha_img;
  t.redirectUri = data.redirect_uri;

  var params = t.params = {};
  each(data.request_params, function(param) {
    params[param.key] = param.value;
  });

  var method = t.method = params.method;
  delete params.method;
  // Что это такое мне неизвестно
  t.oauth = params.oauth;
  delete params.oauth;

  t.message = template(
    '[Error Code: {code}, Message: {msg}]' +
    ' An error occurred while calling method "{method}"' +
    ' with parameters: {params}',
    {
      code: t.errorCode,
      msg: t.errorMsg,
      method: method,
      params: JSON.stringify(t.params)
    }
  );
}

ApiError.prototype = Error.prototype;

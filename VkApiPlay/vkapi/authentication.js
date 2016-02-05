if (typeof Qt != "undefined") {
  Qt.include("http.js");
  Qt.include("eventemitter.js");
}

var AUTH_BASE = "https://oauth.vk.com";
var CLIENT_ID = 2274003;
var CLIENT_SECRET = "hHbZxrka2uZ6jB1inYsH";

function Authentication(options) {
  options = options || {};
  var t = this;
  t.apiVersion = options.apiVersion;
  t.clientId = options.clientId;
  t.clientSecret = options.clientSecret;
  t.scope = options.scope;
  if (!t.clientId && !t.clientSecret) {
    t.clientId = CLIENT_ID;
    t.clientSecret = CLIENT_SECRET;
  }
}

Authentication.prototype = {
  response: null,

  authenticate: function(username, password, captchaKey) {
    var t = this;
    var params = {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: "password",
      username: username,
      password: password
    };
    if (t.apiVersion) {
      params.v = t.apiVersion;
    }
    if (t.scope) {
      params.scope = t.scope;
    }
    if (captchaKey) {
      params.captcha_key = captchaKey;
      params.captcha_sid = t.response.captcha_sid;
    }
    var endpoint = AUTH_BASE + '/token';
    sendGetRequest(endpoint , function(response) {
      t.response = response;
      if (response.error) {
        t.emit("error");
        return;
      }
      t.emit("success");
    }, params);
  },
};

EventEmitter.mixin(Authentication);

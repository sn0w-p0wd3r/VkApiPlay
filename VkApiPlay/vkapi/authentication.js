if (typeof Qt != "undefined") {
  Qt.include("utils.js");
  Qt.include("eventemitter.js");
  Qt.include("accesstoken.js");
}

var AUTH_BASE = "https://oauth.vk.com";
var CLIENT_ID = 2274003;
var CLIENT_SECRET = "hHbZxrka2uZ6jB1inYsH";

function Authentication(client, options) {
  options = options || {};
  var t = this;
  t.client = client;
  t.authBase = options.authBase || AUTH_BASE;
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
      v: t.client.apiVersion,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: "password",
      username: username,
      password: password
    };
    if (t.scope) {
      params.scope = t.scope;
    }
    if (captchaKey) {
      params.captcha_key = captchaKey;
      params.captcha_sid = t.response.captcha_sid;
    }
    var endpoint = this.authBase + '/token';
    t.client.sendGetRequest(endpoint , function(response) {
      t.response = response;
      if (response.error) {
        t.emit("error");
        return;
      }
      t.client.accessToken = new AccessToken().fromResponse(response);
      t.emit("success");
    }, params);
  },
};

EventEmitter.mixin(Authentication);

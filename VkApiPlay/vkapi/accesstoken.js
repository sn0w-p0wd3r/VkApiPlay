if (typeof Qt != "undefined") {
  Qt.include("http.js");
}

function AccessToken() {}

AccessToken.prototype = {
  SERIALIZED_PROPERTIES: ['accessToken', 'created', 'email', 'expiresIn',
    'secret', 'userId'],
  // localStorage.setItem('access_token', accessToken.serialize())
  serialize: function() {
    var self = this;
    var o = {};
    self.SERIALIZED_PROPERTIES.forEach(function(p) {
      if (self[p] != null) {
        o[p] = self[p];
      }
    });
    return JSON.stringify(o);
  },
  /*
  var serialized = localStorage.getItem('access_token');
  if (serialized) {
    var accessToken = new AccessToken().fromSerialized(serialized);
  }
  */
  fromSerialized: function(str) {
    var self = this;
    var o = JSON.parse(str);
    self.SERIALIZED_PROPERTIES.forEach(function(p) {
      self[p] = o[p];
    });
    return self;
  },
  fromResponse: function(response) {
    this.accessToken = response.access_token;
    this.email = response.email;
    this.expiresIn = response.expires_in;
    this.secret = response.secret;
    this.userId = response.user_id;
    this.created = Date.now();
    return this;
  },
  get expired() {
    return this.expiresIn && Date.now() > this.created + this.expiresIn * 1000;
  },
};

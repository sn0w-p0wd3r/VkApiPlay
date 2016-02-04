var API_VERSION = 5.44;

// Работа с DOM
function $$(selector, element) {
  return (element || document).querySelectorAll(selector);
}

function gid(obj) {
  return typeof obj == 'string' ? document.getElementById(obj) : obj;
}

function val(element, value) {
  element = gid(element);
  var attr = typeof element.value == 'string' ? 'value' : 'innerHTML';
  if (arguments.length > 1) {
    element[attr] = value;
  }
  return element[attr];
}

// Интерфейс
function showLayer(target) {
  target = gid(target);
  each($$('.layer'), function(layer) {
    if (layer === target) {
      document.title = layer.getAttribute('data-title');
      layer.style.display = "block";
    } else {
      layer.style.display = "none";
    }
  });
}

function showLogin() {
  showLayer("login_layer");
}

function showMain() {
  showLayer("main_layer");
}

function logout() {
  localStorage.removeItem('access_token');
  api.cancelAllRequests();
  showLogin();
}

// refresh captcha
each($$('.captcha_image'), function(img) {
  img.addEventListener('click', function() {
    img.src = img.src.replace(/&q=\d+/, '') + '&q=' + Date.now();
  });
});

var options = {version: API_VERSION};
var serialized = localStorage.getItem('access_token');
if (serialized) {
  options.token = new AccessToken().fromSerialized(serialized);
}
var api = new Api(options);

// Проверка токена
if (api.token) {
  console.log("Test token");
  api.execute('', {
    done: function() {
      console.log("Test access token passed");
      showMain();
    }
  });
} else {
  showLogin();
}

//
// Аутентификация
//
var auth = new Authentication({apiVersion: api.version});
// var auth = new Authentication(api, {scope: 'nohttps'});
var loginForm = gid("login_form");
var loginCaptchaImage = gid("login_captcha_image");
var loginCaptchaWrapper = gid("login_captcha_wrapper");
var loginError = gid('login_error');
var loginCaptchaWrapper = gid('login_captcha_wrapper');
var loginUsername = gid('login_username');
var loginPassword = gid('login_password');
var loginCaptchaCode = gid('login_captcha_code');
var loginButton = gid('login_button');

loginCaptchaImage.addEventListener('load', function() {
  loginCaptchaWrapper.style.display = 'block';
  loginCaptchaCode.focus();
});

auth.on('error', function() {
  var response = this.response;
  if (response.error == "need_captcha") {
    loginCaptchaImage.src = response.captcha_img;
  } else {
    loginError.style.display = 'block';
    var message = response.error_description ?
      template("<b>{error}</b>: {error_description}", response) :
      response.error;
    val('login_error_message', message);
    // Очищаем поле ввода пароля
    val(loginPassword, '');
    // Устанавливаем фокус на имя
    loginUsername.focus();
    // Выбираем весь текст
    loginUsername.select();
  }
});

auth.on('success', function() {
  api.token = new AccessToken().fromResponse(this.response);
  localStorage.setItem('access_token', api.token.serialize());
  showMain();
});

loginForm.addEventListener('submit', function(ev) {
  ev.preventDefault();
  var captchaKey;
  if (loginCaptchaWrapper.style.display != 'none') {
    captchaKey = val(loginCaptchaCode);
    val(loginCaptchaCode, ''); // reset captcha code
    loginCaptchaWrapper.style.display = 'none';
  }
  loginError.style.display = 'none';
  auth.authenticate(val(loginUsername), val(loginPassword), captchaKey);
});

api.on('error', function(error) {
  var code = error.error_code;
  var request = this.request;
  if (code == ERRORS.USER_AUTHORIZATION_FAILED) {
    request.processResponse = false;
    this.cancelAllRequests();
    showLogin();
  } else if (code == ERRORS.CAPTCHA_NEEDED) {
    request.processResponse = false;
    request.params.captcha_sid = error.captcha_sid;
    captchaImage.src = error.captcha_img;
  }
});

// Капча
var captchaForm = gid("captcha_form");
var captchaImage = gid("captcha_image");
var captchaCode = gid("captcha_code");
var captchaCancelButton = gid("captcha_cancel_button");
var captchaSubmitButton = gid("captcha_submit_button");

captchaImage.onload = function() {
  showLayer('captcha_layer');
  captchaCode.focus();
};

function getCaptchaCode() {
  return val(captchaCode);
}

captchaCancelButton.addEventListener('click', function(e) {
  e.preventDefault();
  captchaForm.reset();
  // Я хз как тут поступать надо
  // api.clearAllRequests();
  api.request.next();
  showMain();
});

captchaForm.addEventListener('submit', function(e) {
  e.preventDefault();
  api.request.params.captcha_key = getCaptchaCode();
  this.reset();
  api.request.retry();
  showMain();
});

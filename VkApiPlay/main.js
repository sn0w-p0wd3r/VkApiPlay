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
  vk.cancelApiRequests();
  showLogin();
}

// refresh captcha
each($$('.captcha_image'), function(img) {
  img.addEventListener('click', function() {
    img.src = img.src.replace(/&q=\d+/, '') + '&q=' + Date.now();
  });
});

var options = {};
var serialized = localStorage.getItem('access_token');
if (serialized) {
  options.accessToken = new AccessToken().fromSerialized(serialized);
}
var vk = new ApiClient(options);

// Проверка токена
if (vk.accessToken) {
  console.log("Test access token");
  vk.testAccessToken(function(success) {
    if (success) {
      console.log("Test access token passed");
      showMain();
    } else {
      showLogin();
    }
  });
} else {
  showLogin();
}

//
// Аутентификация
//
var auth = new Authentication(vk);
// var auth = new Authentication(vk, {scope: 'nohttps'});
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
  localStorage.setItem('access_token', vk.accessToken.serialize());
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

vk.on('error', function(error) {
  console.error(error.toString());
  var code = error.errorCode;
  if (code == ERRORS.USER_AUTHORIZATION_FAILED) {
    this.processing = false;
    this.cancelApiRequests();
    showLogin();
  } else if (code == ERRORS.CAPTCHA_NEEDED) {
    this.processing = false;
    this.apiRequest.params.captcha_sid = error.captchaSid;
    captchaImage.src = error.captchaImg;
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
  // vk.clearAllRequests();
  vk.processApiQueue();
  showMain();
});

captchaForm.addEventListener('submit', function(e) {
  e.preventDefault();
  vk.apiRequest.params.captcha_key = getCaptchaCode();
  this.reset();
  vk.processApiRequest();
  showMain();
});

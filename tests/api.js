var api = new Api();

// !!!Так не следует делать. Этот пример лишь для демонстрациитого, что запросы
// отправляются по очереди. Нужно использовать рекурсию.
for (var i = 1; i <= 10; ++i) {
  api.call('users.get', function(error, users) {
    if (error) {
      return;
    }
    var user = users[0];
    console.log("id%s: %s %s", user.id, user.first_name, user.last_name);
  }, {user_id: i}, i * 1000);
}

// Капча, приди!
for (var i = 1; i <= 20; ++i) {
  api.call('wall.post', function(error, post) {
      console.log(post);
  }, {message: "Test #" + i});
}

(new Api()).call('wall.post', {message: "Test!"});

// Сценарии на VkScript не удобно хранить в строковом представлении, зато можно
// хранить в теле функции. Символ `@` не является валидным, поэтому мы
// используем шаблон ($at). 
function test() {
  return API.getProfiles({"uids": API.audio.search({"q": "Beatles", "count": 3})($at).owner_id})($at).last_name;
}

console.log(toVkScript(test));

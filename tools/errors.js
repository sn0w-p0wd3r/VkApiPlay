// Ошибки API. Используем английскую версию сайта
(() => {
  // https://vk.com/dev/errors
  var eq = ":",
    lines = [];
  lines.push('/** ');
  lines.push(' * Данный модуль содержит некоторые коды ошибок');
  lines.push(' * ');
  lines.push(' * Подробнее про ошибки Api можно прочитать по ссылке');
  lines.push(' * <https://vk.com/dev/errors>.');
  lines.push(' */ ');
  lines.push('');
  lines.push('var ERRORS = {')
  each(document.querySelectorAll('.dev_param_row'), (_, el) => {
    var code = el.firstChild.textContent,
      name = el.firstChild.nextSibling.querySelector('b').textContent;
    // Есть знаки пунктуации, значит название является длинным
    if (/[^ \w]/.test(name))
      return;
    var words = name.split(' ');
    // Названия не длинее 5 слов
    if (words.length > 5)
      return;
    name = words.join('_').toUpperCase();
    lines.push("  " + name + eq + " " + code + ",");
  })
  lines.push('};');
  lines.push('');
  console.log(lines.join('\n'));
})();

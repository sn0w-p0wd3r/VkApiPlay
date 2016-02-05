if (typeof Qt != "undefined") {
  Qt.include("common.js");
}

// Сцнарии VkScript удобно хранить в теле функций
function toVkScript(fn, replacements) {
  // Символ @ является невалидным, поэтому мы его заменяем шаблоном ($at)
  replacements = extend({at: '@'}, replacements);
  var code = fn.toString().replace(/^.*?\{|\}$/g, '');
  for (var i in replacements) {
    if (replacements.hasOwnProperty(i)) {
      var re = RegExp('\\(\\$' + i + '\\)', 'g');
      code = code.replace(re, replacements[i]);
    }
  }
  return code;
}

/*
function test() {
  return API.getProfiles({"uids": API.audio.search({"q": "Beatles", "count": 3})($at).owner_id})($at).last_name;
}

console.log(toVkScript(test));

Output:

  return API.getProfiles({"uids": API.audio.search({"q": "Beatles", "count": 3})@.owner_id})@.last_name;
*/

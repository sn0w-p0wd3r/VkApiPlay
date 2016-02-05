function rand(min, max) {
  return Math.random() * (max - min + 1) + min;
}

function getFileUrl(path) {
  return "file:///" + path;
}

// Получаем содержимое папки
function listDir(path, callback) {
  sendGetRequest(getFileUrl(path), function(response) {
    var re = /<script>addRow\((.+?)\);<\/script>/g;
    var match;
    var items = [];
    while (match = re.exec(response)) {
      var data = JSON.parse('[' + match[1] + ']');
      items.push({
        name: data[0],
        urlEncodedName: data[1],
        isFile: data[2] == 0,
        isDirectory: data[2] == 1,
        // Можно бы было в байты перевести, только на разных ОС 1 кб может быть
        // равен как 1000 байт так и 1024
        size: data[3],
        modified: data[4],
        // modifiedTimestamp: new Date(data[4]).getTime()
      });
    }
    callback(items);
  });
}

/*
listDir("D:/Downloads/", function(result) { console.log(result); });

...
1: Object
  isDirectory: true
  isFile: false
  modified: "09.01.15, 18:10:37"
  name: "Civilization V + DLC + Expansions PC  MULTi-6 ^^nosTEAM^^"
  size: "0 B"
  urlEncodedName: "Civilization%20V%20+%20DLC%20+%20Expansions%20PC%20%20MULTi-6%20%5E%5EnosTEAM%5E%5E"
  __proto__: Object */

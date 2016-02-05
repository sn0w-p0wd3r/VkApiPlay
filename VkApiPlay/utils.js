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

function vkUpload(url, files, callback) {
  function upload() {
    var fd = new FormData;
    for (var i in results) {
      if (results.hasOwnProperty(i)) {
        var result = results[i];
        fd.append(result.name, result.blob, result.filename);
      }
    }
    var request = new XMLHttpRequest();
    request.open('POST', url);
    request.onload = function() {
      if (this.status == 200) {
        typeof callback == "function" && callback(JSON.parse(this.response));
      } else {
        console.error("Upload error");
      }
    };
    request.send(fd);
  }
  // Для начала нужно получить содержимое всех файлов
  var results = [];
  Object.keys(files).forEach(function(key, _, keys) {
    var request = new XMLHttpRequest();
    request.open("GET", files[key]);
    request.responseType = "blob";
    request.onload = function() {
      var filename = files[key].replace(/.*\//, '').replace(/\?.*/, '');
      results.push({name: key, blob: this.response, filename: filename});
      if (results.length == keys.length) {
        upload();
      }
    };
    request.send();
  });
}

// "https://pp.vk.me/c633216/v633216778/f8f6/k9BzDsUwp4w.jpg".replace(/.*\//, '').replace(/\?.*/, '');
/* 

// Test album:
// https://vk.com/album-113813852_227532080

// Не работает
// Uploading Photos into User Album
(function(files, callback, aid, gid) {
  api.call('photos.getUploadServer', function(err, data) {
    if (err) throw err;
    console.log(data);
    vkUpload(data.upload_url, files, function(data) {
      console.log(data);
      api.call('photos.save', callback, data);
    });
  }, {album_id: aid, group_id: gid});
})({
  "file-1": "https://pp.vk.me/c633216/v633216778/f8f6/k9BzDsUwp4w.jpg",
  "file-2": "https://pp.vk.me/c625719/v625719778/3b4b3/ncXeHH_E5eE.jpg",
}, function(err, data) {
  if (err) throw err;
  console.log(data);
}, 227710519, 0);

// Работает
// Uploading Photos on User Wall
(function(files, callback, gid) {
  api.call('photos.getWallUploadServer', function(err, data) {
    if (err) throw err;
    vkUpload(data.upload_url, files, function(result) {
      api.call('photos.saveWallPhoto', callback, result);
    });
  }, {group_id: gid});
})({
  photo: "https://pp.vk.me/c633216/v633216778/f8f6/k9BzDsUwp4w.jpg",
}, function(err, photos) {
  if (err) throw err;
  var photo = photos[0];
  api.call('wall.post', function(err, post) {
    if (err) throw err;
    console.log(post);
  }, {
    attachment: template('photo{owner_id}_{id}', photo)
  });
}, 0);

*/

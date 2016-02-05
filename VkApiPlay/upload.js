(function(win){
  function getXhr(method, url, callback) {
    var xhr = new XMLHttpRequest;
    xhr.open(method.toUpperCase(), url);
    xhr.onload = function() {
      if (this.status == 200) {
        callback(this.response);
      } else {
        console.error("HTTPError: %s %s", this.status, this.statusText);
      }
    };
    return xhr;
  }

  function uploadData(url, data, callback) {
    var fd = new FormData;
    for (var i = 0; i < data.length; ++i) {
      fd.append(data[i].name, data[i].blob, data[i].filename);
    }
    var req = getXhr("POST", url, callback);
    req.responseType = "json";
    req.send(fd);
  }

  function fetchData(files, callback) {
    var data = [];
    var keys = Object.keys(files);
    function push(name, blob, filename) {
      data.push({name: name, blob: blob, filename: filename});
    }
    function check() {
      if (data.length == keys.length) {
        callback(data);
      }
    }
    each(keys, function(key) {
      if (Array.isArray(files[key])) {
        push(key, files[key][0], files[key][1]);
      } else {
        var req = getXhr("GET", files[key], function(resp) {
          var filename = files[key].replace(/#.*/, '').replace(/\?.*/, '').
            replace(/.*[\\/]/, '');
          push(key, resp, filename);
          check();
        });
        req.responseType = "blob";
        req.send();
      }
    });
    check(); // Если ничего загружать не пришлось
  }

  // @param files {object} fieldname => url || [blob, filename]
  win.ApiClient.prototype.upload = function(url, files, callback) {
    fetchData(files, function(data) {
      uploadData(url, data, function(resp) {
        callback(resp);
      });
    });
  };

  win.ApiClient.prototype.uploadAlbumPhotos = function(files, callback, aid,
      gid) {
    var t = this;
    t.api('photos.getUploadServer', function(e, r) {
      if (e) {
        return;
      }
      t.upload(r.upload_url, files, function(r) {
        if (r.error) {
          console.error(r.error);
        }
        if (!r.album_id) {
          r.album_id = aid;
        }
        if (!r.group_id) {
          r.group_id = gid;
        }
        delete r.aid;
        delete r.gid;
        vk.api('photos.save', callback, r);
      });
    }, {album_id: aid, group_id: gid || ''});
  };

  /* 

  vk.uploadWallPhoto({
    photo: "https://pp.vk.me/c633216/v633216778/f8f6/k9BzDsUwp4w.jpg",
  }, function(e, photos) {
    if (e) {
      return;
    }
    var photo = photos[0];
    vk.api('wall.post', function(e, psto) {
      if (e) {
        return;
      }
      console.log(psto);
    }, {
      attachment: template('photo{owner_id}_{id}', photo)
    });
  });

  */
  win.ApiClient.prototype.uploadWallPhoto = function(files, callback, gid) {
    var t = this;
    t.api('photos.getWallUploadServer', function(e, r) {
      if (e) {
        return;
      }
      t.upload(r.upload_url, files, function(r) {
        if (r.error) {
          console.error(r.error);
        }
        vk.api('photos.saveWallPhoto', callback, r);
      });
    }, {group_id: gid || ''});
  };
})(this);

// "https://pp.vk.me/c633216/v633216778/f8f6/k9BzDsUwp4w.jpg".replace(/.*\//, '').replace(/\?.*/, '');
/* 

// Test album:
// https://vk.com/album-113813852_227532080

// https://github.com/VKCOM/vk-android-sdk/blob/master/vksdk_library/src/main/java/com/vk/sdk/vk/photo/VKUploadAlbumPhotoRequest.java
// Uploading Photos into User Album
(function(files, callback, aid, gid) {
  vk.api('photos.getUploadServer', function(err, data) {
    if (err) return;
    vkUpload(data.upload_url, files, function(data) {
      // Почему возвращает aid, а не album_id?
      if (!data.album_id) {
        data.album_id = aid;
      }
      if (!data.group_id) {
        data.group_id = gid;
      }
      vk.api('photos.save', callback, data);
    });
  }, {album_id: aid, group_id: gid});
})({
  "file1": "https://pp.vk.me/c633216/v633216778/f8f6/k9BzDsUwp4w.jpg",
  "file2": "https://pp.vk.me/c625719/v625719778/3b4b3/ncXeHH_E5eE.jpg",
}, function(err, data) {
  if (err) return;
  console.log(data);
}, 227532080, 113813852);

// Uploading Photos on User Wall
(function(files, callback, gid) {
  vk.api('photos.getWallUploadServer', function(err, data) {
    if (err) return;
    vkUpload(data.upload_url, files, function(result) {
      vk.api('photos.saveWallPhoto', callback, result);
    });
  }, {group_id: gid});
})({
  photo: "https://pp.vk.me/c633216/v633216778/f8f6/k9BzDsUwp4w.jpg",
}, function(err, photos) {
  if (err) return;
  var photo = photos[0];
  vk.api('wall.post', function(err, post) {
    if (err) return;
    console.log(post);
  }, {
    attachment: template('photo{owner_id}_{id}', photo)
  });
}, 0);

*/

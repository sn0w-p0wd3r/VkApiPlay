console.log("background.js started");

chrome.browserAction.onClicked.addListener(function(tab) {
  var url = chrome.extension.getURL('main.htm');
  // http://goo.gl/KTQ7ns
  // Запрещаем открывать более одного таба с расширением
  chrome.tabs.query({'url': url}, function(tabs) {
    if (!tabs.length) {
      chrome.tabs.create({'url': url});
    } else {
      chrome.tabs.update(tabs[0].id, {active: true});
    }
  });
});

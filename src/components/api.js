let api = (function(){
  let module = {};

  // using ajax
  function send(method, url, data, callback){
    let xhr = new XMLHttpRequest();

    xhr.onload = function() {
      // success!
      if (xhr.status !== 200) {
        callback("[" + xhr.status + "]" + xhr.responseText, null);
      } else {
        callback(null, JSON.parse(xhr.responseText));
      }
    };

    xhr.open(method, url, true);
    if (!data) xhr.send();
    else{
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(data));
    }
  }

  module.getCurrentUser = function () {
    console.log('getCurrentUser')
    let l = document.cookie.split("username=");
    console.log(l);
    if (l.length > 1) return l[1];
    return null;
  };

  // sign up as a new user
  module.signup = function(username, password, callback){
    send("POST", "/api/signup/", {username: username, password: password}, callback);
  };

  // sign in with credentials
  module.signin = function(username, password, callback){
    send("POST", "/api/signin/", {username: username, password: password}, callback);
  };

  // sign out of the session
  module.signout = function(callback) {
    send("GET", '/api/signout/', callback);
  };

  // get all usernames (no pagination)
  module.getUsernames = function(callback){
    send("GET", "/api/usernames/", null, callback);
  };

  // create game room
  module.createGameRoom = function(callback){
    send("POST", "/api/room/createroom/", null, callback);
  };

  return module;
})();

export default api

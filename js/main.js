
/////////////INDEX PAGE///////////////

'use strict';

var API_URL = 'http://www.omdbapi.com/?t=';
var movie;
var $divContain = $('.movie-container');
var $addButton = $('.add');
var $divTable = $('.movie-list');

//FIREBASE VARIABLES

var FIREBASE_AUTH = 'https://mymdb.firebaseio.com';
var fb = new Firebase(FIREBASE_AUTH);
var favMovies;

//////////LOGIN PAGE JAVASCRIPT//////////////////

//LOGOUT
$('.doLogout').click(function () {
  fb.unauth();
  $divTable.empty();
});

//LOGIN EVENT TRIGGER
$('.login form').submit(function () {
  var email = $('.login input[type="email"]').val();
  var password = $('.login input[type="password"]').val();

  doLogin(email, password);
  event.preventDefault();
});

//LOGIN ACTION AUTHORIZATION
function doLogin(email, password, cb) {
  fb.authWithPassword({
    email: email,
    password: password
  }, function (err, authData) {
    if (err) {
      alert(err.toString());
    } else {
      saveAuthData(authData);
      typeof cb === 'function' && cb(authData); //read about this
    }
  });
}

//AUTHORIZATION DATA
function saveAuthData(authData) {
  var info = fb.child('/users/' + authData.uid + '/profile');
  info.set(authData);
}

//REGISTRATION PROCESS
$('.doRegister').click(function () {
  var email = $('.login input[type="email"]').val();
  var password = $('.login input[type="password"]').val();

  fb.createUser({
    email: email,
    password: password
  }, function (err, userData) {
    if (err) {
      alert(err.toString());
    } else {
      doLogin(email, password);
      console.log('Successfully created user account with uid:', userData.uid);
    }
  });
  event.preventDefault();
});

//CLEARING form
function clearLoginForm() {
  $('.login input[type="email"]').val('');
  $('.login input[type="password"]').val('');
}

//RESET Password
$('.doResetPassword').click(function () {
  var email = $('.login input[type="email"]').val();
  fb.resetPassword({
    email: email
  }, function (err) {
    if (err) {
      alert(err.toString());
    } else {
      alert('Check your email!');
    }
  });
});

//CHANGE PASSWORD
$('.onTempPassword form').submit(function () {
  var email = fb.getAuth().password.email;
  var oldPw = $('.onTempPassword input:nth-child(1)').val();
  var newPw = $('.onTempPassword input:nth-child(2)').val();

  fb.changePassword({
    email: email,
    oldPassword: oldPw,
    newPassword: newPw
  }, function (err) {
    if (err) {
      alert(err.toString());
    } else {
      fb.unauth();
    }
  });
  event.preventDefault();
});

//ONLOAD DATA WITH toggle of forms
//if authData is true, they are logged in.
fb.onAuth(function (authData) {
  if (authData && authData.password.isTemporaryPassword && window.location.pathname !== '/mymdb/reset/') {
    window.location = 'mymdb/reset';
  } else if (authData && !authData.password.isTemporaryPassword && window.location.pathname === '/mymdb') {
    favMovies = fb.child('users/' + fb.getAuth().uid + '/movies');
    favMovies.on('child_added', function (snapshot) {
      //when movie is added, capture data
      var obj = {}; //creating object
      obj[snapshot.key()] = snapshot.val(); //storing snapshot.val as property
      userMovies(obj); //passing that object to this function
    });
  } else if (!authData && window.location.pathname !== '/login/') {
    window.location = 'login/';
    $('.onLoggedIn').addClass('hidden');
  }
  clearLoginForm();
});

//Onload get function for MOVIE DATA
function userMovies(data) {
  if (data) {
    var id = Object.keys(data)[0]; //Grabbing the id but I think I already define this
    saveMovieToDiv(data[id], id);
  }
}

//MAIN PAGE
//SEARCH FOR MOVIES
$('.submit-form').submit(function (evt) {
  evt.preventDefault();
  movie = $(this).find('input[type!="submit"]').val();
  var url = API_URL + movie.split(' ').join('+');
  $.get(url, addMovieToDiv, 'jsonp');
  $addButton.show();
  $('.movie_result').addClass('result_styling');
});

//Adds first HTML fragment to div and empties it for next search
function addMovieToDiv(data) {
  var current_movie = data;
  $divContain.empty();
  $divContain.append(createMovieNode(data));
}

//HTML fragment for first div
function createMovieNode(data) {
  var movie_info = $('<div></div>');
  movie_info.addClass('movie');
  var poster = $('<img src=\'' + data.Poster + '\'></img>');
  poster.attr('class', 'col-md-6');
  var title = $('<h3>' + data.Title + '</h3>');
  var year = $('<h4>' + data.Year + '</h4>');
  var genre = $('<p>' + data.Genre + '</p>');
  var rating = $('<p>' + data.imdbRating + '</p>');
  movie_info.append(poster, title, year, genre, rating);
  return movie_info;
}

//Adding movies into firebase and table click function
$addButton.click(function () {
  movie = $('input').val();
  var url = API_URL + movie.split(' ').join('+');
  $.get(url, function (data) {
    favMovies.push(data, function (err) {
      console.log(err);
    });
  }, 'jsonp');
});

//appending data for second onclick
function saveMovieToDiv(data, id) {
  $divTable.append(createMovieTable(data, id));
}

//html to insert for second button info
function createMovieTable(data, id) {
  var tr = $('<tr></tr>');
  tr.attr('data-id', id); //passing the name of the attibute and value. Need to make sure id is set from the GET from firebase.
  tr.attr('class', 'movie_row');

  var td = $('<td><img class=\'small_poster\' src=\'' + data.Poster + '\'></img></td>');
  var td_1 = $('<td>' + data.Title + '</td>');
  var td_2 = $('<td>' + data.Year + '</td>');
  var td_3 = $('<td>' + data.Genre + '</td>');
  var td_4 = $('<td>' + data.imdbRating + '</td>');
  var td_5 = $('<input type="button" class="btn btn-danger del_btn" value="X">');

  tr.append(td, td_1, td_2, td_3, td_4, td_5);
  return tr;
}

//to delete rows
var $rows = $('.movie-list');
$rows.on('click', '.btn', function () {
  var $movie_row = $(this).closest('.movie_row');
  var id = $movie_row.attr('data-id');
  favMovies.child(id).set(null); //removing url from firebase. could also .remove() instead of set?
  $movie_row.remove(); //removing row from table
  favMovies.on('child_removed', function () {});
});

// var deleteUrl = FIREBASE_AUTH + '/users/' + fb.getAuth().uid + '/movies.json'.slice(0, -5) + '/' + id + '.json?auth=' + fb.getAuth().token;
// $.ajax({
//   url: deleteUrl,
//   type: 'DELETE',
//   success: function() {
//     $movie_row.remove();
//   }
// })
//# sourceMappingURL=data:application/json;base64,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QUUsTUFBTSxFQUFFLFlBQVc7QUFDbkMsTUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUMvQyxNQUFJLEVBQUUsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ2xDLFdBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzlCLFlBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUNyQixXQUFTLENBQUMsRUFBRSxDQUFDLGVBQWUsRUFBRSxZQUFXLEVBQ3pDLENBQUMsQ0FBQTtDQUNILENBQUMsQ0FBQyIsImZpbGUiOiJzcmMvanMvbWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuLy8vLy8vLy8vLy8vL0lOREVYIFBBR0UvLy8vLy8vLy8vLy8vLy9cblxudmFyIEFQSV9VUkwgPSBcImh0dHA6Ly93d3cub21kYmFwaS5jb20vP3Q9XCI7XG52YXIgbW92aWU7XG52YXIgJGRpdkNvbnRhaW4gPSAkKCcubW92aWUtY29udGFpbmVyJyk7XG52YXIgJGFkZEJ1dHRvbiA9ICQoJy5hZGQnKTtcbnZhciAkZGl2VGFibGUgPSAkKCcubW92aWUtbGlzdCcpO1xuXG4vL0ZJUkVCQVNFIFZBUklBQkxFU1xuXG52YXIgRklSRUJBU0VfQVVUSCA9ICdodHRwczovL215bWRiLmZpcmViYXNlaW8uY29tJztcbnZhciBmYiA9IG5ldyBGaXJlYmFzZShGSVJFQkFTRV9BVVRIKTtcbnZhciBmYXZNb3ZpZXM7XG5cbi8vLy8vLy8vLy9MT0dJTiBQQUdFIEpBVkFTQ1JJUFQvLy8vLy8vLy8vLy8vLy8vLy9cblxuLy9MT0dPVVRcbiQoJy5kb0xvZ291dCcpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgZmIudW5hdXRoKCk7XG4gICRkaXZUYWJsZS5lbXB0eSgpO1xufSlcblxuLy9MT0dJTiBFVkVOVCBUUklHR0VSXG4kKCcubG9naW4gZm9ybScpLnN1Ym1pdChmdW5jdGlvbiAoKSB7XG4gIHZhciBlbWFpbCA9ICQoJy5sb2dpbiBpbnB1dFt0eXBlPVwiZW1haWxcIl0nKS52YWwoKTtcbiAgdmFyIHBhc3N3b3JkID0gJCgnLmxvZ2luIGlucHV0W3R5cGU9XCJwYXNzd29yZFwiXScpLnZhbCgpO1xuXG4gIGRvTG9naW4oZW1haWwsIHBhc3N3b3JkKVxuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xufSk7XG5cbi8vTE9HSU4gQUNUSU9OIEFVVEhPUklaQVRJT05cbmZ1bmN0aW9uIGRvTG9naW4gKGVtYWlsLCBwYXNzd29yZCwgY2IpIHtcbiAgZmIuYXV0aFdpdGhQYXNzd29yZCh7XG4gICAgZW1haWw6IGVtYWlsLFxuICAgIHBhc3N3b3JkOiBwYXNzd29yZFxuICB9LCBmdW5jdGlvbiAoZXJyLCBhdXRoRGF0YSkge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGFsZXJ0KGVyci50b1N0cmluZygpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2F2ZUF1dGhEYXRhKGF1dGhEYXRhKTtcbiAgICAgIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJyAmJiBjYihhdXRoRGF0YSk7IC8vcmVhZCBhYm91dCB0aGlzXG4gICAgfVxuICB9KTtcbn1cblxuLy9BVVRIT1JJWkFUSU9OIERBVEFcbmZ1bmN0aW9uIHNhdmVBdXRoRGF0YSAoYXV0aERhdGEpIHtcbiAgdmFyIGluZm8gPSBmYi5jaGlsZCgnL3VzZXJzLycgKyBhdXRoRGF0YS51aWQgKyAnL3Byb2ZpbGUnKTtcbiAgaW5mby5zZXQoYXV0aERhdGEpO1xufVxuXG4vL1JFR0lTVFJBVElPTiBQUk9DRVNTXG4kKCcuZG9SZWdpc3RlcicpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgdmFyIGVtYWlsID0gJCgnLmxvZ2luIGlucHV0W3R5cGU9XCJlbWFpbFwiXScpLnZhbCgpO1xuICB2YXIgcGFzc3dvcmQgPSAkKCcubG9naW4gaW5wdXRbdHlwZT1cInBhc3N3b3JkXCJdJykudmFsKCk7XG5cbiBmYi5jcmVhdGVVc2VyKHtcbiAgICBlbWFpbDogZW1haWwsXG4gICAgcGFzc3dvcmQ6IHBhc3N3b3JkXG4gIH0sIGZ1bmN0aW9uIChlcnIsIHVzZXJEYXRhKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgYWxlcnQoZXJyLnRvU3RyaW5nKCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkb0xvZ2luKGVtYWlsLCBwYXNzd29yZClcbiAgICAgIGNvbnNvbGUubG9nKFwiU3VjY2Vzc2Z1bGx5IGNyZWF0ZWQgdXNlciBhY2NvdW50IHdpdGggdWlkOlwiLCB1c2VyRGF0YS51aWQpO1xuICAgIH1cbiAgfSk7XG4gIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG59KTtcblxuXG4vL0NMRUFSSU5HIGZvcm1cbmZ1bmN0aW9uIGNsZWFyTG9naW5Gb3JtICgpIHtcbiAgJCgnLmxvZ2luIGlucHV0W3R5cGU9XCJlbWFpbFwiXScpLnZhbCgnJyk7XG4gICQoJy5sb2dpbiBpbnB1dFt0eXBlPVwicGFzc3dvcmRcIl0nKS52YWwoJycpO1xufVxuXG5cbi8vUkVTRVQgUGFzc3dvcmRcbiQoJy5kb1Jlc2V0UGFzc3dvcmQnKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gIHZhciBlbWFpbCA9ICQoJy5sb2dpbiBpbnB1dFt0eXBlPVwiZW1haWxcIl0nKS52YWwoKTtcbiAgZmIucmVzZXRQYXNzd29yZCh7XG4gICAgZW1haWw6IGVtYWlsXG4gIH0sIGZ1bmN0aW9uKGVycil7XG4gICAgaWYgKGVycikge1xuICAgICAgYWxlcnQoZXJyLnRvU3RyaW5nKCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhbGVydCgnQ2hlY2sgeW91ciBlbWFpbCEnKTtcbiAgICB9XG4gIH0pO1xufSk7XG5cbi8vQ0hBTkdFIFBBU1NXT1JEXG4kKCcub25UZW1wUGFzc3dvcmQgZm9ybScpLnN1Ym1pdChmdW5jdGlvbiAoKSB7XG4gIHZhciBlbWFpbCA9IGZiLmdldEF1dGgoKS5wYXNzd29yZC5lbWFpbDtcbiAgdmFyIG9sZFB3ID0gJCgnLm9uVGVtcFBhc3N3b3JkIGlucHV0Om50aC1jaGlsZCgxKScpLnZhbCgpO1xuICB2YXIgbmV3UHcgPSAkKCcub25UZW1wUGFzc3dvcmQgaW5wdXQ6bnRoLWNoaWxkKDIpJykudmFsKCk7XG5cbiAgZmIuY2hhbmdlUGFzc3dvcmQoe1xuICAgIGVtYWlsICAgICAgIDogZW1haWwsXG4gICAgb2xkUGFzc3dvcmQgOiBvbGRQdyxcbiAgICBuZXdQYXNzd29yZCA6IG5ld1B3XG4gIH0sIGZ1bmN0aW9uKGVycikge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGFsZXJ0KGVyci50b1N0cmluZygpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZmIudW5hdXRoKCk7XG4gICAgfVxuICB9KTtcbiAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbn0pXG5cblxuLy9PTkxPQUQgREFUQSBXSVRIIHRvZ2dsZSBvZiBmb3Jtc1xuLy9pZiBhdXRoRGF0YSBpcyB0cnVlLCB0aGV5IGFyZSBsb2dnZWQgaW4uXG5mYi5vbkF1dGgoZnVuY3Rpb24gKGF1dGhEYXRhKSB7XG4gIGlmIChhdXRoRGF0YSAmJiBhdXRoRGF0YS5wYXNzd29yZC5pc1RlbXBvcmFyeVBhc3N3b3JkICYmIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSAhPT0gJy9yZXNldC8nKSB7XG4gICAgd2luZG93LmxvY2F0aW9uID0gJy9yZXNldCc7XG4gIH0gZWxzZSBpZiAoYXV0aERhdGEgJiYgIWF1dGhEYXRhLnBhc3N3b3JkLmlzVGVtcG9yYXJ5UGFzc3dvcmQgJiYgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lID09PSAnLycgKSB7XG4gICAgZmF2TW92aWVzID0gZmIuY2hpbGQoYHVzZXJzLyR7ZmIuZ2V0QXV0aCgpLnVpZH0vbW92aWVzYClcbiAgICBmYXZNb3ZpZXMub24oJ2NoaWxkX2FkZGVkJywgZnVuY3Rpb24gKHNuYXBzaG90KXsgIC8vd2hlbiBtb3ZpZSBpcyBhZGRlZCwgY2FwdHVyZSBkYXRhXG4gICAgICB2YXIgb2JqID0ge307IC8vY3JlYXRpbmcgb2JqZWN0XG4gICAgICBvYmpbc25hcHNob3Qua2V5KCldID0gc25hcHNob3QudmFsKCk7ICAvL3N0b3Jpbmcgc25hcHNob3QudmFsIGFzIHByb3BlcnR5XG4gICAgICB1c2VyTW92aWVzKG9iaik7ICAvL3Bhc3NpbmcgdGhhdCBvYmplY3QgdG8gdGhpcyBmdW5jdGlvblxuICAgIH0pXG4gIH0gZWxzZSBpZiAoIWF1dGhEYXRhICYmIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSAhPT0gJy9sb2dpbi8nKXtcbiAgICAgd2luZG93LmxvY2F0aW9uID0gJy9sb2dpbi8nO1xuICAgICAkKCcub25Mb2dnZWRJbicpLmFkZENsYXNzKCdoaWRkZW4nKTtcbiAgfVxuICAgIGNsZWFyTG9naW5Gb3JtKCk7XG59KVxuXG5cbi8vT25sb2FkIGdldCBmdW5jdGlvbiBmb3IgTU9WSUUgREFUQVxuZnVuY3Rpb24gdXNlck1vdmllcyhkYXRhKSB7XG4gaWYgKGRhdGEpIHtcbiAgdmFyIGlkID0gT2JqZWN0LmtleXMoZGF0YSlbMF07IC8vR3JhYmJpbmcgdGhlIGlkIGJ1dCBJIHRoaW5rIEkgYWxyZWFkeSBkZWZpbmUgdGhpc1xuICBzYXZlTW92aWVUb0RpdihkYXRhW2lkXSwgaWQpXG4gIH1cbn1cblxuXG4vL01BSU4gUEFHRVxuLy9TRUFSQ0ggRk9SIE1PVklFU1xuJCgnLnN1Ym1pdC1mb3JtJykuc3VibWl0KGZ1bmN0aW9uIChldnQpIHtcbiAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gIG1vdmllID0gICQodGhpcykuZmluZCgnaW5wdXRbdHlwZSE9XCJzdWJtaXRcIl0nKS52YWwoKTtcbiAgdmFyIHVybCA9IEFQSV9VUkwgKyBtb3ZpZS5zcGxpdChcIiBcIikuam9pbihcIitcIik7XG4gICQuZ2V0KHVybCwgYWRkTW92aWVUb0RpdiwgJ2pzb25wJyk7XG4gICRhZGRCdXR0b24uc2hvdygpO1xuICAkKCcubW92aWVfcmVzdWx0JykuYWRkQ2xhc3MoXCJyZXN1bHRfc3R5bGluZ1wiKTtcbn0pO1xuXG4vL0FkZHMgZmlyc3QgSFRNTCBmcmFnbWVudCB0byBkaXYgYW5kIGVtcHRpZXMgaXQgZm9yIG5leHQgc2VhcmNoXG5mdW5jdGlvbiBhZGRNb3ZpZVRvRGl2KGRhdGEpIHtcbiAgdmFyIGN1cnJlbnRfbW92aWUgPSBkYXRhO1xuICAkZGl2Q29udGFpbi5lbXB0eSgpO1xuICAkZGl2Q29udGFpbi5hcHBlbmQoY3JlYXRlTW92aWVOb2RlKGRhdGEpKTtcbiB9XG5cblxuLy9IVE1MIGZyYWdtZW50IGZvciBmaXJzdCBkaXZcbmZ1bmN0aW9uIGNyZWF0ZU1vdmllTm9kZShkYXRhKSB7XG4gIHZhciBtb3ZpZV9pbmZvID0gJCgnPGRpdj48L2Rpdj4nKTtcbiAgbW92aWVfaW5mby5hZGRDbGFzcyhcIm1vdmllXCIpO1xuICB2YXIgcG9zdGVyID0gJChcIjxpbWcgc3JjPSdcIiArIGRhdGEuUG9zdGVyICsgXCInPjwvaW1nPlwiKTtcbiAgcG9zdGVyLmF0dHIoJ2NsYXNzJywgJ2NvbC1tZC02Jyk7XG4gIHZhciB0aXRsZSA9ICQoJzxoMz4nICsgZGF0YS5UaXRsZSArICc8L2gzPicpO1xuICB2YXIgeWVhciA9ICQoJzxoND4nICsgZGF0YS5ZZWFyICsgJzwvaDQ+Jyk7XG4gIHZhciBnZW5yZSA9ICQoJzxwPicgKyBkYXRhLkdlbnJlICsgJzwvcD4nKTtcbiAgdmFyIHJhdGluZyA9ICQoJzxwPicgKyBkYXRhLmltZGJSYXRpbmcgKyAnPC9wPicpO1xuICBtb3ZpZV9pbmZvLmFwcGVuZChwb3N0ZXIsIHRpdGxlLCB5ZWFyLCBnZW5yZSwgcmF0aW5nKTtcbiAgcmV0dXJuIG1vdmllX2luZm87XG59XG5cblxuLy9BZGRpbmcgbW92aWVzIGludG8gZmlyZWJhc2UgYW5kIHRhYmxlIGNsaWNrIGZ1bmN0aW9uXG4kYWRkQnV0dG9uLmNsaWNrKGZ1bmN0aW9uKCkge1xuICBtb3ZpZSA9ICAkKFwiaW5wdXRcIikudmFsKCk7XG4gIHZhciB1cmwgPSBBUElfVVJMICsgbW92aWUuc3BsaXQoXCIgXCIpLmpvaW4oXCIrXCIpO1xuICAkLmdldCh1cmwsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICBmYXZNb3ZpZXMucHVzaChkYXRhLCBmdW5jdGlvbihlcnIpe1xuICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgIH0pXG4gIH0sICdqc29ucCcpO1xufSk7XG5cblxuLy9hcHBlbmRpbmcgZGF0YSBmb3Igc2Vjb25kIG9uY2xpY2tcbmZ1bmN0aW9uIHNhdmVNb3ZpZVRvRGl2KGRhdGEsIGlkKSB7XG4gICRkaXZUYWJsZS5hcHBlbmQoY3JlYXRlTW92aWVUYWJsZShkYXRhLCBpZCkpO1xufVxuXG4vL2h0bWwgdG8gaW5zZXJ0IGZvciBzZWNvbmQgYnV0dG9uIGluZm9cbmZ1bmN0aW9uIGNyZWF0ZU1vdmllVGFibGUoZGF0YSwgaWQpIHtcbiAgdmFyIHRyID0gJCgnPHRyPjwvdHI+JylcbiAgdHIuYXR0cignZGF0YS1pZCcsIGlkKTsgLy9wYXNzaW5nIHRoZSBuYW1lIG9mIHRoZSBhdHRpYnV0ZSBhbmQgdmFsdWUuIE5lZWQgdG8gbWFrZSBzdXJlIGlkIGlzIHNldCBmcm9tIHRoZSBHRVQgZnJvbSBmaXJlYmFzZS5cbiAgdHIuYXR0cignY2xhc3MnLCAnbW92aWVfcm93Jyk7XG5cbiAgdmFyIHRkID0gJChcIjx0ZD48aW1nIGNsYXNzPSdzbWFsbF9wb3N0ZXInIHNyYz0nXCIgKyBkYXRhLlBvc3RlciArIFwiJz48L2ltZz48L3RkPlwiKTtcbiAgdmFyIHRkXzEgPSAkKCc8dGQ+JyArIGRhdGEuVGl0bGUgKyAnPC90ZD4nKTtcbiAgdmFyIHRkXzIgPSAkKCc8dGQ+JyArIGRhdGEuWWVhciArICc8L3RkPicpO1xuICB2YXIgdGRfMyA9ICQoJzx0ZD4nICsgZGF0YS5HZW5yZSArICc8L3RkPicpO1xuICB2YXIgdGRfNCA9ICQoJzx0ZD4nICsgZGF0YS5pbWRiUmF0aW5nICsgJzwvdGQ+Jyk7XG4gIHZhciB0ZF81ID0gJCgnPGlucHV0IHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tZGFuZ2VyIGRlbF9idG5cIiB2YWx1ZT1cIlhcIj4nKTtcblxuICB0ci5hcHBlbmQodGQsIHRkXzEsIHRkXzIsIHRkXzMsIHRkXzQsIHRkXzUpO1xuICByZXR1cm4gdHI7XG59XG5cbi8vdG8gZGVsZXRlIHJvd3NcbnZhciAkcm93cyA9ICQoJy5tb3ZpZS1saXN0Jyk7XG4kcm93cy5vbignY2xpY2snLCAnLmJ0bicsIGZ1bmN0aW9uKCkge1xuICB2YXIgJG1vdmllX3JvdyA9ICQodGhpcykuY2xvc2VzdCgnLm1vdmllX3JvdycpO1xuICB2YXIgaWQgPSAkbW92aWVfcm93LmF0dHIoJ2RhdGEtaWQnKTtcbiAgICBmYXZNb3ZpZXMuY2hpbGQoaWQpLnNldChudWxsKTsgIC8vcmVtb3ZpbmcgdXJsIGZyb20gZmlyZWJhc2UuIGNvdWxkIGFsc28gLnJlbW92ZSgpIGluc3RlYWQgb2Ygc2V0P1xuICAgICRtb3ZpZV9yb3cucmVtb3ZlKCk7IC8vcmVtb3Zpbmcgcm93IGZyb20gdGFibGVcbiAgIGZhdk1vdmllcy5vbignY2hpbGRfcmVtb3ZlZCcsIGZ1bmN0aW9uKCkge1xuICB9KVxufSk7XG5cbiAgLy8gdmFyIGRlbGV0ZVVybCA9IEZJUkVCQVNFX0FVVEggKyAnL3VzZXJzLycgKyBmYi5nZXRBdXRoKCkudWlkICsgJy9tb3ZpZXMuanNvbicuc2xpY2UoMCwgLTUpICsgJy8nICsgaWQgKyAnLmpzb24/YXV0aD0nICsgZmIuZ2V0QXV0aCgpLnRva2VuO1xuICAvLyAkLmFqYXgoe1xuICAvLyAgIHVybDogZGVsZXRlVXJsLFxuICAvLyAgIHR5cGU6ICdERUxFVEUnLFxuICAvLyAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKCkge1xuICAvLyAgICAgJG1vdmllX3Jvdy5yZW1vdmUoKTtcbiAgLy8gICB9XG4gIC8vIH0pXG5cbiJdfQ==

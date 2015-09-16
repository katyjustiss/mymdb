
/////////////INDEX PAGE///////////////

var API_URL = "http://www.omdbapi.com/?t=";
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
})

//LOGIN EVENT TRIGGER
$('.login form').submit(function () {
  var email = $('.login input[type="email"]').val();
  var password = $('.login input[type="password"]').val();

  doLogin(email, password)
  event.preventDefault();
});

//LOGIN ACTION AUTHORIZATION
function doLogin (email, password, cb) {
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
function saveAuthData (authData) {
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
      doLogin(email, password)
      console.log("Successfully created user account with uid:", userData.uid);
    }
  });
  event.preventDefault();
});


//CLEARING form
function clearLoginForm () {
  $('.login input[type="email"]').val('');
  $('.login input[type="password"]').val('');
}


//RESET Password
$('.doResetPassword').click(function () {
  var email = $('.login input[type="email"]').val();
  fb.resetPassword({
    email: email
  }, function(err){
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
    email       : email,
    oldPassword : oldPw,
    newPassword : newPw
  }, function(err) {
    if (err) {
      alert(err.toString());
    } else {
      fb.unauth();
    }
  });
  event.preventDefault();
})


//ONLOAD DATA WITH toggle of forms
//if authData is true, they are logged in.
fb.onAuth(function (authData) {
  if (authData && authData.password.isTemporaryPassword && window.location.pathname !== '/reset/') {
    window.location = '/reset';
  } else if (authData && !authData.password.isTemporaryPassword && window.location.pathname === '/' ) {
    favMovies = fb.child(`users/${fb.getAuth().uid}/movies`)
    favMovies.on('child_added', function (snapshot){  //when movie is added, capture data
      var obj = {}; //creating object
      obj[snapshot.key()] = snapshot.val();  //storing snapshot.val as property
      userMovies(obj);  //passing that object to this function
    })
  } else if (!authData && window.location.pathname !== '/login/'){
     window.location = '/login/';
     $('.onLoggedIn').addClass('hidden');
  }
    clearLoginForm();
})


//Onload get function for MOVIE DATA
function userMovies(data) {
 if (data) {
  var id = Object.keys(data)[0]; //Grabbing the id but I think I already define this
  saveMovieToDiv(data[id], id)
  }
}


//MAIN PAGE
//SEARCH FOR MOVIES
$('.submit-form').submit(function (evt) {
  evt.preventDefault();
  movie =  $(this).find('input[type!="submit"]').val();
  var url = API_URL + movie.split(" ").join("+");
  $.get(url, addMovieToDiv, 'jsonp');
  $addButton.show();
  $('.movie_result').addClass("result_styling");
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
  movie_info.addClass("movie");
  var poster = $("<img src='" + data.Poster + "'></img>");
  poster.attr('class', 'col-md-6');
  var title = $('<h3>' + data.Title + '</h3>');
  var year = $('<h4>' + data.Year + '</h4>');
  var genre = $('<p>' + data.Genre + '</p>');
  var rating = $('<p>' + data.imdbRating + '</p>');
  movie_info.append(poster, title, year, genre, rating);
  return movie_info;
}


//Adding movies into firebase and table click function
$addButton.click(function() {
  movie =  $("input").val();
  var url = API_URL + movie.split(" ").join("+");
  $.get(url, function(data) {
    favMovies.push(data, function(err){
      console.log(err)
    })
  }, 'jsonp');
});


//appending data for second onclick
function saveMovieToDiv(data, id) {
  $divTable.append(createMovieTable(data, id));
}

//html to insert for second button info
function createMovieTable(data, id) {
  var tr = $('<tr></tr>')
  tr.attr('data-id', id); //passing the name of the attibute and value. Need to make sure id is set from the GET from firebase.
  tr.attr('class', 'movie_row');

  var td = $("<td><img class='small_poster' src='" + data.Poster + "'></img></td>");
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
$rows.on('click', '.btn', function() {
  var $movie_row = $(this).closest('.movie_row');
  var id = $movie_row.attr('data-id');
    favMovies.child(id).set(null);  //removing url from firebase. could also .remove() instead of set?
    $movie_row.remove(); //removing row from table
   favMovies.on('child_removed', function() {
  })
});

  // var deleteUrl = FIREBASE_AUTH + '/users/' + fb.getAuth().uid + '/movies.json'.slice(0, -5) + '/' + id + '.json?auth=' + fb.getAuth().token;
  // $.ajax({
  //   url: deleteUrl,
  //   type: 'DELETE',
  //   success: function() {
  //     $movie_row.remove();
  //   }
  // })


const User = require('../models/User');
const Post = require('../models/Post');

exports.mustBeLoggedIn = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    req.flash('errors', 'You must be logged in to perform that action');
    req.session.save(callback => res.redirect('/'));
  }
};

exports.login = function(req, res) {
  let user = new User(req.body);
  user
    .login()
    .then(result => {
      req.session.user = {
        avatar: user.avatar,
        username: user.data.username,
        _id: user.data._id
      };
      // although the above stmt would store the session in db automatically
      // we store it manually in db to use a callback for redirect to home
      // see https://github.com/expressjs/session
      req.session.save(callback => {
        res.redirect('/');
      });
    })
    .catch(err => {
      // store error msg in session cookie in db
      req.flash('errors', err);
      res.redirect('/');
    });
};

exports.logout = function(req, res) {
  // delete session cookie in database
  req.session.destroy(callback => {
    //display homepage as anonymous user after logged out
    res.redirect('/');
  });
};

exports.register = (req, res) => {
  let user = new User(req.body);
  user
    .register()
    .then(() => {
      req.session.user = {
        username: user.data.username,
        avatar: user.avatar,
        _id: user.data._id
      };
      req.session.save(callback => res.redirect('/'));
    })
    .catch(errors => {
      errors.forEach(error => req.flash('regErrors', error));
      req.session.save(callback => res.redirect('/'));
    });
};

exports.home = function(req, res) {
  if (req.session.user) {
    res.render('home-dashboard');
  } else {
    // display error message and clear it from db-cookie
    res.render('home-guest', {
      regErrors: req.flash('regErrors')
    });
  }
};

exports.ifUserExists = function(req, res, next) {
  User.findByUsername(req.params.username)
    .then(userDoc => {
      req.profileUser = userDoc;
      next();
    })
    .catch(err => {
      console.log('ERROR', err);
      res.render('404');
    });
};

exports.profilePostsScreen = function(req, res) {
  // get all posts of a certain author id
  Post.findByAuthorId(req.profileUser._id)
    .then(posts => {
      // expose only the needed properties
      res.render('profile', {
        posts: posts,
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar
      });
    })
    .catch(err => {
      console.log('ERROR in profilePostsScreen: ', err);
      res.render('404');
    });
};

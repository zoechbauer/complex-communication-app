const User = require('../models/User');

exports.login = function(req, res) {
  let user = new User(req.body);
  user
    .login()
    .then(result => {
      req.session.user = {
        favColor: 'blue',
        username: user.data.username
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
      req.session.user = { username: user.data.username };
      req.session.save(callback => res.redirect('/'));
    })
    .catch(errors => {
      errors.forEach(error => req.flash('regErrors', error));
      req.session.save(callback => res.redirect('/'));
    });
};

exports.home = function(req, res) {
  console.log('req.session.user', req.session.user);
  if (req.session.user) {
    res.render('home-dashboard', { username: req.session.user.username });
  } else {
    // display error message and clear it from db-cookie
    res.render('home-guest', {
      errors: req.flash('errors'),
      regErrors: req.flash('regErrors')
    });
  }
};

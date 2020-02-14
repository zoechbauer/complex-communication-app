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
      res.send(result);
    })
    .catch(err => res.send(err));
};

exports.logout = function() {};

exports.register = (req, res) => {
  let user = new User(req.body);
  user.register();
  if (user.errors.length) {
    res.send(user.errors);
  } else {
    res.send('Congrats, there are no errors');
  }
};

exports.home = function(req, res) {
  console.log('req.session.user', req.session.user);
  if (req.session.user) {
    res.send('Welcome to the actual application!!');
  } else {
    res.render('home-guest');
  }
};

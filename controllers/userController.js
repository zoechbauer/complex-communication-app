const User = require('../models/User');

exports.login = function(req, res) {
  let user = new User(req.body);
  user.login(callback => {
    res.send(callback);
  });
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
  res.render('home-guest');
};

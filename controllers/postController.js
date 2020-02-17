const Post = require('../models/Post');

exports.viewCreateScreen = (req, res) => {
  res.render('create-post');
};

exports.create = (req, res) => {
  let post = new Post(req.body);
  post
    .create()
    .then(() => {
      res.send('Post stored in database');
    })
    .catch(err => {
      res.send('error in postController.create: ' + err);
    });
};

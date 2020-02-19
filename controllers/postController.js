const Post = require('../models/Post');

exports.viewCreateScreen = (req, res) => {
  res.render('create-post');
};

exports.create = (req, res) => {
  let post = new Post(req.body, req.session.user._id);
  post
    .create()
    .then(newId => {
      req.flash('success', 'Post successfully created');
      req.session.save(callback => res.redirect(`/post/${newId}`));
    })
    .catch(err => {
      req.flash('errors', err);
      req.sessio.save(callback => res.redirect('/create-post'));
    });
};

exports.viewSingle = async (req, res) => {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId);
    res.render('single-post-screen', {
      post: post
    });
  } catch (error) {
    res.render('404');
  }
};

exports.viewEditScreen = async (req, res) => {
  try {
    const post = await Post.findSingleById(req.params.id);
    console.log('view', post);
    if (post.authorId == req.visitorId) {
      res.render('edit-post', { post: post });
    } else {
      req.flash('errors', 'You are not permitted to perform that action');
      req.session.save(callback => res.redirect('/'));
    }
  } catch (error) {
    console.log('ERROR in view EditScreen: ', error);
    res.render(404);
  }
};

exports.edit = (req, res) => {
  let post = new Post(req.body, req.visitorId, req.params.id);
  console.log('post', post);
  post
    .update()
    .then(status => {
      if (status == 'success') {
        // successful db update
        console.log('db update');
        req.flash('success', 'Post successfully updated');
        req.session.save(callback =>
          res.redirect(`/post/${req.params.id}/edit`)
        );
      } else {
        // validation errors
        console.log('validation errors');
        post.errors.forEach(error => {
          req.flash('errors', error);
        });
        req.session.save(callback =>
          res.redirect(`/post/${req.params.id}/edit`)
        );
      }
    })
    .catch(err => {
      // a post with the requested id doesn't exists
      // or if the current user is not the owner of the requested post
      console.log('ERROR:', err);
      req.flash('errors', 'You do not have permission to perform that action');
      req.session.save(callback => res.redirect('/'));
    });
};

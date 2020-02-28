const Post = require('../models/Post');

exports.viewCreateScreen = (req, res) => {
  res.render('create-post', { title: 'Create new post' });
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
      errors.forEach(err => req.flash('errors, err'));
      req.session.save(callback => res.redirect('/create-post'));
    });
};

exports.apiCreate = (req, res) => {
  let post = new Post(req.body, req.apiUser._id);
  post
    .create()
    .then(newId => {
      res.json('The new post has been created');
    })
    .catch(errors => {
      console.log('ERR in apiCreate', errors);
      res.json(errors);
    });
};

exports.viewSingle = async (req, res) => {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId);
    res.render('single-post-screen', {
      post: post,
      title: post.title
    });
  } catch (error) {
    res.render('404', { title: 'ERROR' });
  }
};

exports.viewEditScreen = async (req, res) => {
  try {
    const post = await Post.findSingleById(req.params.id, req.visitorId);
    if (post.isVisitorOwner) {
      res.render('edit-post', { post: post, title: `Edit ${post.title}` });
    } else {
      req.flash('errors', 'You are not permitted to perform that action');
      req.session.save(callback => res.redirect('/'));
    }
  } catch (error) {
    console.log('ERROR in view EditScreen: ', error);
    res.render('404', { title: 'ERROR' });
  }
};

exports.edit = (req, res) => {
  let post = new Post(req.body, req.visitorId, req.params.id);
  post
    .update()
    .then(status => {
      if (status == 'success') {
        // successful db update
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

exports.delete = function(req, res) {
  Post.delete(req.params.id, req.visitorId)
    .then(info => {
      req.flash('success', 'Post successfully deleted');
      req.session.save(callback =>
        res.redirect(`/profile/${req.session.user.username}`)
      );
      console.log('post deleted: ' + info);
    })
    .catch(err => {
      req.flash('errors', 'You have no permission to perform that action');
      req.session.save(callback => res.redirect('/'));
      console.log('ERROR on delete post: ' + err);
    });
};

exports.apiDelete = function(req, res) {
  Post.delete(req.params.id, req.apiUser._id)
    .then(() => {
      res.json('Post successfully deleted');
    })
    .catch(errors => {
      console.log(errors);
      res.json('You do not have permission to perform that action');
    });
};

exports.search = (req, res) => {
  Post.search(req.body.searchTerm)
    .then(posts => {
      res.json(posts);
    })
    .catch(err => {
      console.log('Error in search:', err);
      res.json([]);
    });
};

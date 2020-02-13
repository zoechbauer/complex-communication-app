const mongodb = require('mongodb');

// TODO replace connectionstring before commit to GitHub
const connectionString =
  'mongodb+srv://<user:pw_mustBeReplaced>@<cluster_mustBeReplaced>.mongodb.net/TodoApp?retryWrites=true&w=majority';

mongodb.connect(
  connectionString,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  },
  (err, client) => {
    module.exports = client.db();
    const app = require('./app');
    app.listen(3000);
  }
);

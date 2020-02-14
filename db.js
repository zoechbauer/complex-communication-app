const mongodb = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

mongodb.connect(
  process.env.CONNECTIONSTRING,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  },
  (err, client) => {
    // console.log('process.env.CONNECTIONSTRING', process.env.CONNECTIONSTRING);
    module.exports = client.db();
    const app = require('./app');
    app.listen(process.env.PORT);
  }
);

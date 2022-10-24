/* 

response format

exports.getSetup = (req, res) => {
  const params = req.params;
  const query = req.query;
  const body = req.body;

  res.json({
    status: 'success || fail || error',
    data: {
      key1: '...',
      key2: '...',
      ...
    },
    message: 'fail message || error message',
  });
};

// status must be one of the following: success, fail, error
// data is only returned when status is success (does not have to return data if there is nothing to return)
// message is only returned when status is fail or error (must always return message when status is fail or error)

*/

const pg = require('../postgres');

exports.getUser = (req, res) => {
  const { email } = req.query;

  pg.query(`SELECT * FROM member WHERE email = '${email}';`, (err, result) => {
    if (err) {
      res.json({
        status: 'error',
        message: err.message,
      });
      return;
    }

    const resultArr = result.rows; // postgres returns array of rows
    if (resultArr.length === 0) {
      res.json({
        status: 'fail',
        message: 'No user has the given email',
      });
      return;
    }

    const user = resultArr[0]; // resultArr[0] is the first returned row, and it is the only returned row in this case since only 1 user in user table has the given email
    res.json({
      status: 'success',
      data: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  });
};


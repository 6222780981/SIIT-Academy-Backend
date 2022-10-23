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

exports.getWeek = (req, res) => {
  pg.query(`SELECT * FROM week ORDER BY week_id ASC;`, (err, result) => {
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
        message: 'No week has been added',
      });
      return;
    }

    console.log(resultArr);
    res.json({
      status: 'success',
      data: {
        weekId: resultArr[0].week_id,
      },
    });
  });
};

exports.postWeek = (req, res) => {
  const { week_id, video_progress_id, material_id_arr, assignment_id_arr, comment_id_arr, week_title, week_date, video_file_path } = req.body;

  // var programString = extractArray(programArr);

  // (async () => {
  //   var courseCheck = await pg.query(`SELECT course_id FROM course WHERE course_id = '${courseId}';`).then((result) => result.rows);
  //   var usernameCheck = await pg
  //     .query(`SELECT user_id FROM member WHERE username = '${teacherUsername}' AND role = 'teacher';`)
  //     .then((result) => result.rows);

  //   if ((await courseCheck.length) !== 0) {
  //     //courseId already existing in the database
  //     res.json({
  //       status: 'fail',
  //       message: 'course with the given id already exists in database',
  //     });
  //     return;
  //   } else {
  //     // console.log('course can be created, no existing course id matched');
  //   }

  //   if ((await usernameCheck.length) === 0) {
  //     //teacherUsername does not exist
  //     res.json({
  //       status: 'fail',
  //       message: 'teacher with the given username does not exists in database',
  //     });
  //     return;
  //   } else {
  //     // console.log('course can be created, teacherUsername is existing');
  //     // console.log(usernameCheck[0].user_id);
  //     var userIdKeeper = usernameCheck[0].user_id;
  //   }

  //   await pg.query(
  //     `INSERT INTO course(course_id,course_name,teacher_id,program_arr,year_arr) VALUES('${courseId}','${courseName}',${userIdKeeper},ARRAY[${programString}],ARRAY[${yearArr}]);`,
  //     (err, result) => {
  //       if (err) {
  //         // console.log('error in main query');
  //         res.json({
  //           status: 'error',
  //           message: err.message,
  //         });
  //         return;
  //       }

  //       res.json({
  //         status: 'success',
  //         message: 'insertion successful',
  //       });
  //     }
  //   );
  // })();
};

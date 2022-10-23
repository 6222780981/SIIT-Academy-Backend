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
  const { week_id, video_progress_id, material_id_arr, assignment_id_arr, comment_id_arr, week_title, week_date, video_file_path } =
    req.body;

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

exports.postAssignment = (req, res) => {
  const { weekId, title, description, filePath, dueDate } = req.body;

  // console.log(weekId, title, description, filePath, dueDate);
  
  let filepathDB = '';
  let filepathValue = '';

  if (filePath) {
    filepathDB = ',file_path';
    filepathValue = `, '${filePath}'`;
  }
  // console.log('filepathDB: ', filepathDB);
  // console.log('filepathValue: ', filepathValue);

  // console.log(
  //   `INSERT INTO assignment(assignment_title,description${filepathDB},due_date) VALUES ('${title}', '${description}'${filepathValue}, '${dueDate}');`
  // );

  pg.query(`SELECT * FROM assignment WHERE assignment_title = '${title}';`, (err, result) => {
    if (err) {
      res.json({
        status: 'error',
        message: err.message,
      });
      return;
    }
    // console.log('select query:');
    // console.log(result.rows);

    if (result.rows.length !== 0) {
      res.json({
        status: 'fail',
        message: 'assignment with the given title already exists in database',
      });
      return;
    } else {
      pg.query(
        `INSERT INTO assignment(assignment_title,description${filepathDB},due_date) VALUES ('${title}', '${description}'${filepathValue}, '${dueDate}');`,
        (err, result) => {
          if (err) {
            // console.log('error in main query');
            res.json({
              status: 'error',
              message: err.message,
            });
            return;
          } else {// now insert this assignment into week table
            pg.query(`SELECT assignment_id FROM assignment WHERE assignment_title = '${title}';`, (err, result) => {
              if (err) {
                res.json({
                  status: 'error',
                  message: err.message,
                });
                return;
              }
              // console.log('select query:');
              // console.log(result.rows);
              const assignmentId = result.rows[0].assignment_id;
              console.log('assignmentId: ', assignmentId);

              pg.query(
                `UPDATE week SET assignment_id_arr = array_append(assignment_id_arr, ${assignmentId}) WHERE week_id = ${weekId};`,
                (err, result) => {
                  if (err) {
                    res.json({
                      status: 'error',
                      message: err.message,
                    });
                    return;
                  }
                  res.json({
                    status: 'success',
                    message: 'successfully create a new assignment and insert into week table',
                  });
                }
              );
              
            });

          }
          
          // res.json({
          //   status: 'success',
          //   message: 'successfully create a new assignment in database',
          // });
        }
      );
    }
  });
};

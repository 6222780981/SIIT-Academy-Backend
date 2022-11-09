const pg = require('../postgres');

function extractArray(inputArray) {
  var newString = '';

  for (let i in inputArray) {
    if (i > 0) {
      newString += ',';
    }
    newString += "'" + inputArray[i] + "'";
  }

  return newString;
}

//add new course to course table
exports.postCourse = (req, res) => {
  const { courseId, courseName, teacherUsername, programArr, yearArr } = req.body;

  var programString = extractArray(programArr);

  (async () => {
    var courseCheck = await pg.query(`SELECT course_id FROM course WHERE course_id = '${courseId}';`).then((result) => result.rows);
    var usernameCheck = await pg
      .query(`SELECT user_id FROM member WHERE username = '${teacherUsername}' AND role = 'teacher';`)
      .then((result) => result.rows);

    if ((await courseCheck.length) !== 0) {
      //courseId already existing in the database
      res.json({
        status: 'fail',
        message: 'course with the given id already exists in database',
      });
      return;
    } else {
      // console.log('course can be created, no existing course id matched');
    }

    if ((await usernameCheck.length) === 0) {
      //teacherUsername does not exist
      res.json({
        status: 'fail',
        message: 'teacher with the given username does not exists in database',
      });
      return;
    } else {
      // console.log('course can be created, teacherUsername is existing');
      // console.log(usernameCheck[0].user_id);
      var userIdKeeper = usernameCheck[0].user_id;
    }

    await pg.query(
      `INSERT INTO course(course_id,course_name,teacher_id,program_arr,year_arr) VALUES('${courseId}','${courseName}',${userIdKeeper},ARRAY[${programString}],ARRAY[${yearArr}]);`,
      (err, result) => {
        if (err) {
          // console.log('error in main query');
          res.json({
            status: 'error',
            message: err.message,
          });
          return;
        }

        res.json({
          status: 'success',
          message: 'insertion successful',
        });
      }
    );
  })();
};

//find course
exports.getCourse = (req, res) => {
  const { year, program, student_id: studentId, teacher_id: teacherId, courseId } = req.query;

  let where = '';

  if (year) {
    where += `WHERE ${year} = ANY(year_arr)`;
  }

  if (program) {
    where += `${where ? ' AND' : 'WHERE'} '${program}' = ANY(program_arr)`;
  }

  if (studentId) {
    where += `${where ? ' AND' : 'WHERE'} ${studentId} = ANY(student_id_arr)`;
  }

  if (teacherId) {
    where += `${where ? ' AND' : 'WHERE'} teacher_id = ${teacherId}`;
  }

  if (courseId) {
    where += `${where ? ' AND' : 'WHERE'} course_id = '${courseId}'`;
  }

  // console.log(where);

  pg.query(
    `SELECT course.*, member.username, member.email FROM course INNER JOIN member ON course.teacher_id = member.user_id ${where} ORDER BY course_id;`,
    (err, result) => {
      if (err) {
        res.json({
          status: 'error',
          message: err.message,
        });
        return;
      }

      const resultArr = result.rows;
      if (resultArr.length === 0) {
        res.json({
          status: 'fail',
          message: 'courses with the given filter does not exist in database',
        });
        return;
      }

      res.json({
        status: 'success',
        data: {
          courseArr: resultArr,
        },
      });
    }
  );
};

//Delete course
exports.deleteCourse = (req, res) => {
  const { courseId } = req.body;

  pg.query(`SELECT course_id FROM course WHERE course_id = '${courseId}';`, (err, result) => {
    if (err) {
      res.json({
        status: 'error',
        message: err.message,
      });
      return;
    } else if (result.rows.length === 0) {
      //courseId does not exist in database
      res.json({
        status: 'fail',
        message: 'the given course id does not exist in database',
      });
      return;
    } else {
      // console.log('course can be created, no existing course id matched');
      pg.query(`DELETE FROM course WHERE course_id = '${courseId}';`, (err, result) => {
        if (err) {
          res.json({
            status: 'error',
            message: err.message,
          });
          return;
        }
        res.json({
          status: 'success',
          message: 'course deleted successfully',
        });
      });
    }
  });
};

//add student
exports.patchStudent = (req, res) => {
  const { courseId, studentEmailArr } = req.body;
  var studentIdArray;
  // var userIdKeeper;
  // console.log('studentEmailArr is here');
  // console.log(studentEmailArr);
  (async () => {
    //check course
    var courseCheck = await pg.query(`SELECT course_id FROM course WHERE course_id = '${courseId}';`).then((result) => result.rows);

    if ((await courseCheck.length) === 0) {
      //courseId already existing in the database
      res.json({
        status: 'fail',
        message: 'course with the given id does not exists in database',
      });
      return;
    } else {
      // console.log('course exist, can add student');
    }

    //check student in member table
    var emailCheck = await pg
      .query(`SELECT user_id FROM member WHERE email IN ('${studentEmailArr.join("','")}') AND role = 'student';`)
      .then((result) => result.rows);

    //userIdArr contains input user_id (s)
    var userIdArr = emailCheck.map((object) => object.user_id);

    if ((await emailCheck.length) !== studentEmailArr.length) {
      //email does not exist;
      res.json({
        status: 'fail',
        message: 'student with the given email does not exists in database',
      });
      return;
    } else {
      // console.log('student is exist in database');
      // console.log(emailCheck);
      var userIdKeeper = emailCheck[0].user_id;
    }

    //check student duplicate
    pg.query(`SELECT student_id_arr FROM course WHERE course_id ='${courseId}';`).then((row) => {
      studentIdArray = row.rows[0].student_id_arr;
      const found = studentIdArray.some((el) => el === userIdKeeper); // check duplicate email in course (should not be dup)
      // console.log('----studentIdArray----');
      // console.log(studentIdArray);
      if (found) {
        //student duplicate
        res.json({
          status: 'fail',
          message: 'student with the given email already in the course',
        });
        return;
      } else {
        //student can add to course
        for (let i = 0; i < userIdArr.length; i++) {
          // console.log(userIdArr[i]);
          pg.query(
            `UPDATE course SET student_id_arr = array_append(student_id_arr, ${userIdArr[i]}) WHERE course_id = '${courseId}';`,
            (err, result) => {
              if (err) {
                res.json({
                  status: 'error',
                  message: err.message,
                });
                return;
              }
            }
          );
        }
        res.json({
          status: 'success',
          message: 'successfully update student list',
        });
      }
    });
  })();
};

exports.postAnnouncement = (req, res) => {
  const { courseId, announcementDate, content, filePath } = req.body;

  let filepathDB = '';
  let filepathValue = '';

  if (filePath) {
    filepathDB = ',file_path';
    filepathValue = `, '${filePath}'`;
  }

  pg.query(
    `INSERT INTO announcement(announcement_date, content${filepathDB}) VALUES ('${announcementDate}', '${content}'${filepathValue});`,
    (err, result) => {
      if (err) {
        // console.log('error inside insert into announcement');
        res.json({
          status: 'error',
          message: err.message,
        });
        return;
      } else {
        pg.query(
          `SELECT announcement_id FROM announcement WHERE announcement_date = '${announcementDate}' AND content = '${content}';`,
          (err, result) => {
            if (err) {
              // console.log('error inside select announcement_id');
              res.json({
                status: 'error',
                message: err.message,
              });
              return;
            } else {
              const announcementId = result.rows[0].announcement_id;
              pg.query(
                `UPDATE course SET announcement_id_arr = array_append(announcement_id_arr, ${announcementId}) WHERE course_id = '${courseId}';`,
                (err, result) => {
                  if (err) {
                    // console.log('error inside update course');
                    res.json({
                      status: 'error',
                      message: err.message,
                    });
                    return;
                  }
                  res.json({
                    status: 'success',
                    message: 'successfully create new announcement and add to course',
                  });
                }
              );
            }
          }
        );
      }
    }
  );
};

exports.getAnnouncement = (req, res) => {
  const { courseId } = req.query;
  pg.query(`SELECT announcement_id_arr FROM course WHERE course_id = '${courseId}';`, (err, result) => {
    if (err) {
      res.json({
        status: 'error',
        message: err.message,
      });
      return;
    }

    if (result.rows.length === 0) {
      res.json({
        status: 'success',
        message: 'no announcement in this course',
      });
      return;
    } else {
      const announcementIdArr = result.rows[0].announcement_id_arr;
      var announcementArr = [];
      (async () => {
        for (let i = 0; i < announcementIdArr.length; i++) {
          var announcement = await pg
            .query(`SELECT * FROM announcement WHERE announcement_id = ${announcementIdArr[i]};`)
            .then((result) => result.rows);
          announcementArr.push(announcement[0]);
        }
        res.json({
          status: 'success',
          message: 'successfully get announcement list',
          data: announcementArr,
        });
      })();
    }
  });
};

exports.deleteAnnouncement = (req, res) => {
  const { announcementId, courseId } = req.body;
  pg.query(`SELECT * FROM announcement WHERE announcement_id = ${announcementId};`, (err, result) => {
    if (err) {
      res.json({
        status: 'error',
        message: err.message,
      });
      return;
    }
    if (result.rows.length === 0) {
      res.json({
        status: 'fail',
        message: 'announcement does not exist in database',
      });
      return;
    } else {
      pg.query(
        `UPDATE course SET announcement_id_arr = array_remove(announcement_id_arr, ${announcementId}) WHERE course_id = '${courseId}';`,
        (err, result) => {
          if (err) {
            res.json({
              status: 'error',
              message: err.message,
            });
            return;
          }
          pg.query(`DELETE FROM announcement WHERE announcement_id = ${announcementId};`, (err, result) => {
            if (err) {
              res.json({
                status: 'error',
                message: err.message,
              });
              return;
            }
            res.json({
              status: 'success',
              message: 'successfully delete announcement',
            });
          });
        }
      );
    }
  });
};

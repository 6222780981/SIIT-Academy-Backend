const { config } = require('dotenv');
const e = require('express');
const pg = require('../postgres');
const asyncHandler = require('express-async-handler');

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
          console.log('error in main query');
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

//fetch course
exports.getCourse = (req, res) => {
  const { year, program, studentId, teacherId } = req.query;
  console.log(year);
  console.log(program);
  console.log(studentId);
  console.log(teacherId);

  var programString = "'" + program + "'";

  var checkInArray = async (inputValue, wantedCol) => {
    //inputValue= variable from frontend, wantedCol= attribute from database
    return await pg.query(`SELECT ${wantedCol} FROM course WHERE ${inputValue} = any (${wantedCol});`).then((result) => result.rows);
  };

  let where = '';

  (async () => {
    if (await year) {
      console.log('if year');
      var yearCheck = await checkInArray(year, 'year_arr');
      if (yearCheck.length !== 0) {
        // console.log('course found for this year');
        where += `${where.length > 0 ? ' AND' : 'WHERE'} ${year} = any (year_arr)`;
        console.log(where);
      } else {
        // console.log('no course found for this year');
      }
    }

    if (await program) {
      console.log('if program');
      var programCheck = await checkInArray(programString, 'program_arr');
      if (programCheck.length !== 0) {
        // console.log('course found for this program');
        where += `${where.length > 0 ? ' AND' : 'WHERE'} ${programString} = any (program_arr)`;
        console.log(where);
      } else {
        // console.log('no course found for this program');
      }
    }

    if (await studentId) {
      console.log('if student');
      var studentCheck = await checkInArray(studentId, 'student_id_arr');
      if (studentCheck.length !== 0) {
        // console.log('course found for this student');
        where += `${where.length > 0 ? ' AND' : 'WHERE'} ${studentId} = any (student_id_arr)`;
      } else {
        // console.log('no course found for this studentId');
      }
    }
    if (await teacherId) {
      console.log('if teacher');
      where += `${where.length > 0 ? ' AND' : 'WHERE'} teacher_id = ${teacherId}`;
    }

    // console.log(where);
    // console.log('where should be here');
    // console.log(where);
    // console.log('where stop here');

    if ((await where.length) !== 0) {
      console.log(where);
      pg.query(
        `SELECT course.*, member.username FROM course, member ${where}AND course.teacher_id = member.user_id;`,
        (err, result, body) => {
          if (err) {
            res.json({
              status: 'error',
              message: err.message,
            });
            return;
          }

          const resultArr = result.rows; // postgres returns array of rows --> course does not exist
          if (resultArr.length === 0) {
            res.json({
              status: 'fail',
              message: 'Courses with the given filter does not exist in database',
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
    }
  })();
};

//add student
exports.patchStudent = (req, res) => {
  const { courseId, studentEmailArr } = req.body;
  var studentIdArray;
  // var userIdKeeper;

  (async () => {
    var courseCheck = await pg.query(`SELECT course_id FROM course WHERE course_id = '${courseId}';`).then((result) => result.rows);
    var emailCheck = await pg
      .query(`SELECT user_id FROM member WHERE email = '${studentEmailArr}' AND role = 'student';`)
      .then((result) => result.rows);

    if ((await courseCheck.length) === 0) {
      //courseId already existing in the database
      res.json({
        status: 'fail',
        message: 'course with the given id does not exists in database',
      });
      return;
    } else {
      console.log('course exist, can add student');
    }

    if ((await emailCheck.length) === 0) {
      //email does not exist;
      res.json({
        status: 'fail',
        message: 'student with the given email does not exists in database',
      });
      return;
    } else {
      console.log('student is exist in database');
      console.log(emailCheck);
      var userIdKeeper = emailCheck[0].user_id;
    }

    pg.query(`SELECT student_id_arr FROM course WHERE course_id ='${courseId}';`).then((row) => {
      studentIdArray = row.rows[0].student_id_arr;
      const found = studentIdArray.some((el) => el === userIdKeeper); // check duplicate email in course (should not be dup)
      console.log('----studentIdArray----');
      console.log(studentIdArray);
      if (found) {
        //student duplicate
        res.json({
          status: 'fail',
          message: 'student with the given email already in the course',
        });
        return;
      } else {
        //student can add to course
        pg.query(
          `UPDATE course SET student_id_arr = array_append(student_id_arr, (SELECT user_id FROM member WHERE email='${studentEmailArr}')) WHERE course_id = '${courseId}';`,
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
              message: 'successfully update student list',
            });
          }
        );
      }
    });
  })();
};

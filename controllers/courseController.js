const { config } = require('dotenv');
const e = require('express');
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
  const { courseId, courseName, teacherId, programArr, yearArr } = req.body;

  var programString = extractArray(programArr);

  pg.query(
    `INSERT INTO course(course_id,course_name,teacher_id,program_arr,year_arr) VALUES('${courseId}','${courseName}',${teacherId},ARRAY[${programString}],ARRAY[${yearArr}]);`,
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
        message: 'insertion successful',
      });
    }
  );
};

//call course
exports.getCourse = (req, res) => {
  const { yearArr, programArr, studentId, teacherId } = req.body;

  let where = '';
  if (yearArr) {
    where += `${where.length > 0 ? ' AND' : 'WHERE'} year_arr = ${yearArr}`;
  }
  if (programArr) {
    where += `${where.length > 0 ? ' AND' : 'WHERE'} program_arr = ${programArr}`;
  }
  if (studentId) {
    where += `${where.length > 0 ? ' AND' : 'WHERE'} student_id_arr = ${studentId}`;
  }
  if (teacherId) {
    where += `${where.length > 0 ? ' AND' : 'WHERE'} teacher_id = ${teacherId}`;
  }

  pg.query(`SELECT course_id, course_name, teacher_id FROM course ${where} ORDER BY course_id`, (err, result) => {
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
        message: 'No course for given user',
      });
      return;
    }

    const course = resultArr[0]; //check first course
    res.json({
      status: 'success',
      data: {
        courseId: course.course_id,
        courseName: course.course_name,
        course: course.teacher_id,
      },
    });
  });
};

//add student
exports.patchStudent = (req, res) => {
  const { courseId, email } = req.body;
  var studentIdArray;
  var userIdKeeper;

  pg.query(`SELECT user_id FROM member WHERE email='${email}'`).then((result) => {
    userIdKeeper = result.rows[0].user_id;
    pg.query(`SELECT student_id_arr FROM course WHERE course_id ='CSS422';`).then((row) => {
      studentIdArray = row.rows[0].student_id_arr;
      const found = studentIdArray.some((el) => el === userIdKeeper); // check duplicate email in course (should not be dup)

      if (found) {
        // console.log('This user id found in the course');
        res.json({
          status: 'fail',
          message: 'This student is already in the course',
        });
        return;
      } else {
        // console.log('This user id is not found in the course');
        pg.query(
          `UPDATE course SET student_id_arr = array_append(student_id_arr, (SELECT user_id FROM member WHERE email='${email}')) WHERE course_id = '${courseId}';`,
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
              message: 'update successful',
            });
          }
        );
      }
    });
  });
};

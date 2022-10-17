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
  // console.log(programString);

  // console.log(
  //   `INSERT INTO course(course_id,course_name,teacher_id,program_arr,year_arr) VALUES('${courseId}','${courseName}',${teacherId},ARRAY[${tryA}],ARRAY[${yearArr}]);`
  // );

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

exports.getCourse = (req, res) => {};

const pg = require('../postgres');

//add new course to course table
exports.postCourse = (req, res) => {
  const { courseId, courseName, teacherId, programArr, yearArr } = req.body;

  pg.query(
    `INSERT INTO course(course_id,course_name,teacher_id,program_arr,year_arr) VALUES('${courseId}','${courseName}',${teacherId},ARRAY[${programArr}],ARRAY[${yearArr}]);`,
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
        message: 'successful insert',
      });
    }
  );
};

exports.getCourse = (req, res) => {};

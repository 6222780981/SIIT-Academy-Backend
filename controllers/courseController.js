const pg = require('../postgres');

exports.postCourse = (req, res) => {
  const { courseId } = req.query[1];
  const { courseName } = req.query[2];
  const { teacherId } = req.query[3];
  const { programArr } = req.query[4];
  const { yearArr } = req.query[5];

  pg.query(
    `INSERT INTO course(course_id,course_name,teacher_id,program,year) VALUE('${courseId}','${courseName}',${teacherId},${programArr},${yearArr});`,
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

const pg = require('../postgres');

exports.getWeek = (req, res) => {
  const { courseId } = req.query;

  pg.query(
    `SELECT week.* FROM week, course WHERE course.course_id = '${courseId}' AND week.week_id = ANY(course.week_id_arr);`,
    (err, result) => {
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
          resultArr,
        },
      });
    }
  );
};

exports.postWeek = async (req, res) => {
  const { courseId, weekTitle, weekDate, video_file_path } = req.body;

  await pg.query('SELECT course_id FROM course WHERE course_id = $1;', [courseId], (err, result) => {
    if (err) {
      res.json({
        status: 'error',
        message: err.message,
      });
      return;
    } else if (result.rows.length === 0) {
      //cannot find course id in database
      res.json({
        status: 'fail',
        message: 'the given course id does not exist in database',
      });
      return;
    }
  });
  console.log(video_file_path);
  let column = 'week_title, week_date';
  let valueText = `'${weekTitle}', '${weekDate}'`;
  console.log(column);
  if (video_file_path) {
    console.log('video_file_path');
    valueText += `, '${video_file_path}'`;
    // file_path = 'week_title, week_date, video_file_path ) VALUES ($2, $3, $4);';
    column = 'week_title, week_date, video_file_path';
  }

  console.log(`INSERT INTO week (${column}) VALUES (${valueText})`);
  await pg.query(`INSERT INTO week (${column}) VALUES (${valueText})`, (err, result) => {
    if (err) {
      res.json({
        status: 'error',
        message: err.message,
      });
      return;
    }
    // res.json({
    //   status: 'success'
    //   // message: result,
    // });
    pg.query('SELECT * FROM week WHERE week_title = $1 ORDER BY week_id DESC LIMIT 1;', [weekTitle], (err, result) => {
      if (err) {
        res.json({
          status: 'error',
          message: err.message,
        });
        return;
      }
      const weekId = result.rows[0].week_id;
      console.log(weekId);

      pg.query(`UPDATE course SET week_id_arr = array_append(week_id_arr, ${weekId}) WHERE course_id = '${courseId}';`, (err, result) => {
        if (err) {
          res.json({
            status: 'error',
            message: err.message,
          });
          return;
        }
        res.json({
          status: 'success',
          message: 'successfully create a new week in database',
        });
      });
    });
  });
};

//delete week
exports.deleteWeek = async (req, res) => {
  const { weekId, courseId } = req.body;
  await pg.query('SELECT week_id FROM week WHERE week_id = $1;', [weekId], (err, result) => {
    if (err) {
      console.log('error at week find');
      res.json({
        status: 'error',
        message: err.message,
      });
      return;
    } else if (result.rows.length === 0) {
      //cannot find week id in database
      res.json({
        status: 'fail',
        message: 'the given week id does not exist in database',
      });
      return;
    } else {
      pg.query(`SELECT course_id FROM course WHERE course_id = '${courseId}';`, (err, result) => {
        if (err) {
          console.log('error at course find');
          res.json({
            status: 'error',
            message: err.message,
          });
          return;
        } else if (result.rows.length === 0) {
          //cannot find course id in database
          res.json({
            status: 'fail',
            message: 'the given course id does not exist in database',
          });
          return;
        } else {
          pg.query(
            `UPDATE course SET week_id_arr = array_remove(week_id_arr, ${weekId}) WHERE course_id = '${courseId}';`,
            (err, result) => {
              if (err) {
                console.log('error at course update');
                res.json({
                  status: 'error',
                  message: err.message,
                });
                return;
              }
              pg.query(`DELETE FROM week WHERE week_id = ${weekId};`, (err, result) => {
                if (err) {
                  console.log('error at week delete');
                  res.json({
                    status: 'error',
                    message: err.message,
                  });
                  return;
                }
                res.json({
                  status: 'success',
                  message: 'successfully delete a week in database',
                });
              });
            }
          );
        }
      });
    }
  });
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
          } else {
            
            // now insert this assignment into week table
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
        }
      );
    }
  });
};

exports.postMaterial = (req, res) => {
  const { weekId, materialFilePathArr } = req.body;
  console.log('weekId: ', weekId);
  console.log('materialFilePathArr: ', materialFilePathArr);

  for (let i = 0; i < materialFilePathArr.length; i++) {
    console.log('materialFilePathArr[i]: ', materialFilePathArr[i]);
    pg.query(`SELECT * FROM material WHERE material_file_path = '${materialFilePathArr[i]}';`, (err, result) => {
      if (err) {
        res.json({
          status: 'error',
          message: err.message,
        });
        return;
      }

      if (result.rows.length !== 0) {
        res.json({
          status: 'fail',
          message: 'material with the given file path already exists in database, it is index ' + i,
        });
        return;
      } else {
        pg.query(`INSERT INTO material(material_file_path) VALUES ('${materialFilePathArr[i]}');`, (err, result) => {
          if (err) {
            res.json({
              status: 'error',
              message: err.message,
            });
            return;
          }
          pg.query(`SELECT material_id FROM material WHERE material_file_path = '${materialFilePathArr[i]}';`, (err, result) => {
            if (err) {
              res.json({
                status: 'error',
                message: err.message,
              });
              return;
            } else {
              const materialId = result.rows[0].material_id;
              console.log('materialId: ', materialId);

              pg.query(
                `UPDATE week SET material_id_arr = array_append(material_id_arr, ${materialId}) WHERE week_id = ${weekId};`,
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
                    message: 'successfully create a new material and insert into week table',
                  });
                }
              ); //END UPDATE week
            } //else of material_id
          }); //END SELECT material_id
        }); //END INSERT INTO material
      } //end else check duplicate material
    }); //END SELECT QUERY check duplicate material_file_path
  }
};

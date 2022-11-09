const pg = require('../postgres');

exports.getWeek = (req, res) => {
  const { course_id: courseId } = req.query;

  pg.query(
    `SELECT week.* FROM week, course WHERE course.course_id = '${courseId}' AND week.week_id = ANY(course.week_id_arr) ORDER BY week.week_id;`,
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
          weekArr: resultArr,
        },
      });
    }
  );
};

exports.postWeek = async (req, res) => {
  const { courseId, weekTitle, weekDate, videoFilePath } = req.body;

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
  console.log(videoFilePath);
  let column = 'week_title, week_date';
  let valueText = `'${weekTitle}', '${weekDate}'`;
  console.log(column);
  if (videoFilePath) {
    console.log('videoFilePath');
    valueText += `, '${videoFilePath}'`;
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

exports.patchWeek = (req, res) => {
  const { weekId, videoFilePath } = req.body;

  pg.query(`UPDATE week SET video_file_path = '${videoFilePath}' WHERE week_id = ${weekId};`, (err, result) => {
    if (err) {
      res.json({
        status: 'error',
        message: err.message,
      });
      return;
    }
    res.json({
      status: 'success',
      message: 'successfully update video file path',
    });
  });
};

//delete week
exports.deleteWeek = async (req, res) => {
  const { weekId, courseId } = req.body;
  await pg.query(`SELECT week_id FROM week WHERE week_id = ${weekId};`, (err, result) => {
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
        }
        pg.query(`UPDATE course SET week_id_arr = array_remove(week_id_arr, ${weekId}) WHERE course_id = '${courseId}';`, (err, result) => {
          if (err) {
            console.log('error at course update');
            res.json({
              status: 'error',
              message: err.message,
            });
            return;
          }
          pg.query(`SELECT assignment_id_arr FROM week WHERE week_id = ${weekId};`, (err, result) => {
            if (err) {
              console.log('error at assignment find');
              res.json({
                status: 'error',
                message: err.message,
              });
              return;
            }
            const assignmentIdArr = result.rows;
            console.log(assignmentIdArr);
            if (assignmentIdArr[0].assignment_id_arr.length !== 0) {
              console.log(assignmentIdArr[0].assignment_id_arr);
              for (let i = 0; i < assignmentIdArr[0].assignment_id_arr.length; i++) {
                pg.query(`DELETE FROM assignment WHERE assignment_id = ${assignmentIdArr[0].assignment_id_arr[i]};`, (err, result) => {
                  if (err) {
                    console.log('error at assignment delete');
                    res.json({
                      status: 'error',
                      message: err.message,
                    });
                    return;
                  }
                });
              }
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
          });
        });
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
  pg.query(`SELECT * FROM week WHERE week_id = ${weekId};`, (err, result) => {
    if (err) {
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
                  } //end of week update query
                ); //end of week update query
              }); // end of select query
            } // end of else
          }
        ); //end of INSERT query
      } //end of else
    }); //end of SELECT query
  }); //END OF SELECT QUERY
};

exports.getAssignment = (req, res) => {
  const { weekId: week_id } = req.query;
  pg.query(
    `SELECT assignment.* FROM week, assignment WHERE week_id = '${week_id}' AND assignment.assignment_id = ANY(week.assignment_id_arr) ORDER BY assignment_id;`,
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
        message: 'successfully get assignment',
        data: result.rows,
      });
    }
  );
};

exports.deleteAssignment = (req, res) => {
  const { weekId, assignmentId } = req.body;
  pg.query(`SELECT * FROM week WHERE week_id = ${weekId};`, (err, result) => {
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
        message: 'the given week id does not exist in database',
      });
      return;
    } else {
      pg.query(`SELECT * FROM assignment WHERE assignment_id = ${assignmentId};`, (err, result) => {
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
            message: 'the given assignment id does not exist in database',
          });
          return;
        } else {
          pg.query(`DELETE FROM assignment WHERE assignment_id = ${assignmentId};`, (err, result) => {
            if (err) {
              res.json({
                status: 'error',
                message: err.message,
              });
              return;
            }
            pg.query(
              `UPDATE week SET assignment_id_arr = array_remove(assignment_id_arr, ${assignmentId}) WHERE week_id = ${weekId};`,
              (err, result) => {
                if (err) {
                  res.json({
                    status: 'error',
                    message: err.message,
                  });
                  return;
                }
                pg.query(`SELECT * FROM assignment_submission WHERE assignment_id = ${assignmentId};`, (err, result) => {
                  if (err) {
                    res.json({
                      status: 'error',
                      message: err.message,
                    });
                    return;
                  }
                  if (result.rows.length !== 0) {
                    pg.query(`DELETE FROM assignment_submission WHERE assignment_id = ${assignmentId};`, (err, result) => {
                      if (err) {
                        res.json({
                          status: 'error',
                          message: err.message,
                        });
                        return;
                      }
                      res.json({
                        status: 'success',
                        message: 'successfully delete assignment and its submission',
                      });
                    });
                  } else {
                    res.json({
                      status: 'success',
                      message: 'successfully delete assignment',
                    });
                  }
                });
              }
            );
          });
        }
      });
    }
  });
};

exports.postMaterial = (req, res) => {
  const { weekId, materialFilePathArr } = req.body;
  console.log('weekId: ', weekId);
  console.log('materialFilePathArr: ', materialFilePathArr);

  pg.query(`SELECT * FROM material WHERE material_file_path IN ('${materialFilePathArr.join("','")}');`, (err, result) => {
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
        message: 'material with the given file path already exists in database',
      });
      return;
    } else {
      pg.query(`INSERT INTO material(material_file_path) VALUES ('${materialFilePathArr.join("'),('")}');`, (err, result) => {
        // for (let i = 0; i < materialFilePathArr.length; i++) {
        // console.log('materialFilePathArr[i]: ', materialFilePathArr[i]);
        // pg.query(`INSERT INTO material(material_file_path) VALUES ('${materialFilePathArr[i]}');`, (err, result) => {
        console.log('inserting material to material table');
        if (err) {
          res.json({
            status: 'error',
            message: err.message,
          });
          return;
        } else {
          pg.query(
            `SELECT material_id FROM material WHERE material_file_path IN ('${materialFilePathArr.join("','")}');`,
            (err, result) => {
              // console.log('getting material id [' + i + ']: ' + result.rows[0].material_id);
              if (err) {
                res.json({
                  status: 'error',
                  message: err.message,
                });
                return;
              } else {
                const materialId = result.rows.map((row) => row.material_id);
                console.log('materialId: ', materialId);
                pg.query(
                  `UPDATE week SET material_id_arr = array_cat(material_id_arr, ARRAY[${materialId.join(',')}]) WHERE week_id = ${weekId};`,
                  (err, result) => {
                    // console.log('updating week table with material id [' + i + ']: ' + materialId);
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
            }
          ); //END SELECT material_id
        } //else of insert material
      }); //END INSERT INTO material
      // } //for loop i
    } //end else check duplicate material
  }); //END SELECT QUERY check duplicate material_file_path
};

exports.getMaterial = (req, res) => {
  const { weekId: week_id } = req.query;
  pg.query(
    `SELECT material.* FROM week, material WHERE week_id = ${week_id} AND material.material_id = ANY(week.material_id_arr);`,
    (err, result) => {
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
          message: 'material with the given week id does not exist in database',
        });
        return;
      }

      res.json({
        status: 'success',
        message: 'successfully get material',
        data: result.rows,
      });
    }
  );
};

exports.deleteMaterial = (req, res) => {
  const { materialId, weekId } = req.body;
  console.log('materialId: ', materialId);
  console.log('weekId: ', weekId);

  pg.query(`SELECT * FROM material WHERE material_id = ${materialId};`, (err, result) => {
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
        message: 'material with the given material id does not exist in database',
      });
      return;
    } else {
      pg.query(
        `UPDATE week SET material_id_arr = array_remove(material_id_arr,${materialId}) where week_id = ${weekId};`,
        (err, result) => {
          if (err) {
            res.json({
              status: 'error',
              message: err.message,
            });
            return;
          }
          pg.query(`DELETE FROM material WHERE material_id = ${materialId};`, (err, result) => {
            if (err) {
              res.json({
                status: 'error',
                message: err.message,
              });
              return;
            }
            res.json({
              status: 'success',
              message: 'successfully delete material',
            });
          });
        }
      );
    }
  });
};

exports.getSubmission = (req, res) => {
  const { userId: userId, assignmentId: assignmentId } = req.query;
  pg.query(
    `SELECT submission_file.* FROM submission_file, assignment_submission WHERE assignment_submission.user_id = '${userId}' AND assignment_submission.assignment_id = '${assignmentId}' AND submission_file.file_id = assignment_submission.file_id;`,
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
          message: 'no submission found from the given id',
        });
        return;
      }

      console.log(resultArr);

      res.json({
        status: 'success',
        data: {
          submissionArr: resultArr,
        },
        message: 'successfully returned submission with the given id',
      }); // end res.json
    } //end callback
  ); //END  SELECT QUERY
};

exports.postSubmission = (req, res) => {
  const { userId, assignmentId, filePath, submissionDate } = req.body;
  pg.query(`SELECT * FROM assignment WHERE assignment_id = '${assignmentId}';`, (err, result) => {
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
        message: 'no assignment found with the given id',
      });
      return;
    }
    pg.query(`SELECT * FROM member WHERE user_id = '${userId}';`, (err, result) => {
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
          message: 'no member found with the given id',
        });
        return;
      }
      pg.query(`SELECT * FROM submission_file WHERE file_path = '${filePath}';`, (err, result) => {
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
            message: 'submission with the given file path already exists in database',
          });
          return;
        } else {
          pg.query(`INSERT INTO submission_file(file_path, submit_date) VALUES ('${filePath}', '${submissionDate}');`, (err, result) => {
            if (err) {
              res.json({
                status: 'error',
                message: err.message,
              });
              return;
            }
            pg.query(`SELECT file_id FROM submission_file WHERE file_path = '${filePath}';`, (err, result) => {
              if (err) {
                res.json({
                  status: 'error',
                  message: err.message,
                });
                return;
              }
              const fileId = result.rows[0].file_id;
              pg.query(
                `INSERT INTO assignment_submission(user_id, assignment_id, file_id) VALUES ('${userId}', '${assignmentId}', '${fileId}');`,
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
                    message: 'successfully create a new submission',
                  });
                  return;
                }
              ); //end of assignment_submission
            }); //end of INSERT submission_file
          }); //end of member query
        } //end of else
      }); //end of submission_file query
    }); //END SELECT QUERY
  }); //end of assignment query
};

exports.deleteSubmission = (req, res) => {
  const { userId, assignmentId } = req.body;
  pg.query(
    `SELECT file_id FROM assignment_submission WHERE user_id = '${userId}' AND assignment_id = '${assignmentId}';`,
    (err, result) => {
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
          message: 'no submission found with the given id and assignment id',
        });
        return;
      }
      const fileId = result.rows[0].file_id;
      pg.query(`DELETE FROM assignment_submission WHERE user_id = '${userId}' AND assignment_id = '${assignmentId}';`, (err, result) => {
        if (err) {
          res.json({
            status: 'error',
            message: err.message,
          });
          return;
        }
        pg.query(`DELETE FROM submission_file WHERE file_id = '${fileId}';`, (err, result) => {
          if (err) {
            res.json({
              status: 'error',
              message: err.message,
            });
            return;
          }
          res.json({
            status: 'success',
            message: 'successfully deleted the submission',
          });
        }); //end of DELETE submission_file
      }); //end of DELETE assignment_submission
    } //end of callback
  ); //END DELETE QUERY
};

exports.patchVideoProgress = (req, res) => {
  const { userId, weekId, videoProgress } = req.body;

  pg.query(`SELECT * from video_progress where week_id = ${weekId} and user_id = ${userId} ;`, (err, result) => {
    if (err) {
      res.json({
        status: 'error',
        message: err.message,
      });
      return;
    }
    if (result.rows.length === 0) {
      //need to create a new row
      pg.query(
        `INSERT INTO video_progress (user_id, week_id, progress_second) VALUES (${userId}, ${weekId}, '${videoProgress}');`,
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
            message: 'successfully created a new video progress',
          });
          return;
        }
      );
    } else {
      //need to update the existing row
      pg.query(`UPDATE video_progress SET progress_second = '${videoProgress}' WHERE week_id = ${weekId} ;`, (err, result) => {
        if (err) {
          res.json({
            status: 'error',
            message: err.message,
          });
          return;
        }
        res.json({
          status: 'success',
          message: 'successfully updated the video progress',
        });
        return;
      });
    }
  });
};

exports.getVideoProgress = (req, res) => {
  const { userId, weekId } = req.query;

  pg.query(`SELECT * from video_progress where week_id = ${weekId} and user_id = ${userId};`, (err, result) => {
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
        message: 'no video progress found with the given id',
      });
      return;
    }
    res.json({
      status: 'success',
      message: 'successfully retrieved the video progress',
      data: result.rows[0],
    });
    return;
  });
};

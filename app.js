const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser'); //----

const userRouter = require('./routes/userRoutes');
const courseRouter = require('./routes/courseRoutes');
const weekRouter = require('./routes/weekRoutes');

const app = express();

app.use(express.json());
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/user', userRouter);
app.use('/course', courseRouter);
app.use('/week', weekRouter);
// app.use('/course/student', studentcourseRouter);
module.exports = app;

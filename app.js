const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser'); //----

const userRouter = require('./routes/userRoutes');
const courseRouter = require('./routes/courseRoutes');

const app = express();

app.use(express.json());
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/user', userRouter);
app.use('/course', courseRouter);

module.exports = app;

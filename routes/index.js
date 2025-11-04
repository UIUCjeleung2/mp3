/*
 * Connect all of your endpoints together here.
 */
module.exports = function (app) {
    app.use('/api', require('./home.js')(require('express').Router()));
    app.use('/api/users', require('./users.js')(require('express').Router()));
    app.use('/api/tasks', require('./tasks.js')(require('express').Router()));
};

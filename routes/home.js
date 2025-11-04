module.exports = function (router) {

    console.log("I'm in home.js");
    var homeRoute = router.route('/');

    homeRoute.get(function (req, res) {
        var connectionString = process.env.TOKEN;
        var new_link = process.env.MONGODB_URI;
        res.json({
            message: 'My connection string is ahhhhh' + connectionString,
            link: "My link is " + new_link
        });
    });

    return router;
}
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', ensureAuthenticated, function (req, res, next) {
    req.session.output=null;
    res.render('index', {title: 'Upload'});
});


router.get('/output', ensureAuthenticated, function (req, res, next) {
    if (req.session.output)
        res.render('output', {title: 'Output',output:req.session.output});
    else
        res.render('output', {title: 'Output',output:'please Upload a file first and then come check for results'});
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        console.log('authenticated');
        return next();
    }
    console.log('not authenticated');
    res.redirect('/users/login');
}

module.exports = router;

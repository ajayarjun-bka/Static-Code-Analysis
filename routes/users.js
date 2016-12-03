var express = require('express');
var router = express.Router();
var path = require("path");
var uuid = require('uuid');
var multer = require('multer');
var fs = require('fs');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, uuid.v4() + path.extname(file.originalname.toLowerCase()));
    }
});

var upload = multer({storage: storage});

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var sys = require('sys');
var exec = require('child_process').exec;

var User = require('../models/user');

/* GET users listing. */
// router.get('/', function (req, res, next) {
//     res.send('respond with a resource');
// });

router.get('/register', function (req, res, next) {
    res.render('register', {title: 'Register'});
});

router.get('/login', function (req, res, next) {
    res.render('login', {title: 'Login'});
});

router.post('/login',
    passport.authenticate('local', {failureRedirect: '/users/login', failureFlash: 'Invalid username or password'}),
    function (req, res) {
        req.flash('success', 'You are now logged in');
        res.redirect('/');
    });

passport.serializeUser(function (user, done) {
    console.log(user.id);
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.getUserById(id, function (err, user) {
        done(err, user._id);
    });
});

passport.use(new LocalStrategy(function (username, password, done) {
    User.getUserByUsername(username, function (err, user) {
        if (err) throw err;
        if (!user) {
            return done(null, false, {message: 'Unknown User'});
        }

        User.comparePassword(password, user.password, function (err, isMatch) {
            if (err) return done(err);
            if (isMatch) {
                return done(null, user);
            } else {
                return done(null, false, {message: 'Invalid Password'});
            }
        });
    });
}));

router.post('/register', function (req, res, next) {
    var name = (req.body.name);
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;
    var codename = "empty";

    // Form Validator
    req.checkBody('name', 'Name field is required').notEmpty();
    console.log(name.length);
    if (name.length != 0) {
        console.log("looop in");
        req.checkBody('name', 'Name Can contain only alphabets,numbers,"_","-" and Minimum 3 characters')
            .matches(/^[a-z0-9_-]{3,16}$/);
    }
    req.checkBody('email', 'Email field is required').notEmpty();
    if (email.length != 0) {
        req.checkBody('email', 'Email is not valid').isEmail();
    }
    req.checkBody('username', 'Username field is required').notEmpty();
    if (username.length != 0) {
        req.checkBody('username', 'Name Can contain only alphabets,numbers,"_","-" and Minimum 3 characters and max 16')
            .matches(/^[a-z0-9_-]{3,16}$/);
    }
    req.checkBody('password', 'Password field is required').notEmpty();
    if (password.length != 0) {
        req.checkBody('password', 'Passwor should contain minumum  8 characters,atleast one UpperCase and a Number')
            .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/, "i");
    }
    req.checkBody('password2', 'Confirm Password field is required').notEmpty();
    if (password2.length != 0) {
        req.checkBody('password2', 'Passwords do not match').equals(req.body.password);
    }
    // Check Errors
    var errors = req.validationErrors();

    if (errors) {
        res.render('register', {
            errors: errors
        });
    } else {
        User.getUserByUsername(username, function (err, user) {
            if (err) throw err;
            if (user) {
                console.log("User Already Found")
                req.flash('failure', 'Username Not Available');
                res.location('/users/register');
                res.redirect('/users/register');
            }
            else {
                var newUser = new User({
                    name: name,
                    email: email,
                    username: username,
                    password: password,
                    codename: codename
                });

                User.createUser(newUser, function (err, user) {
                    if (err) throw err;
                    console.log(user);
                });
                req.flash('success', 'You are now registered and can login.');
                res.location('/');
                res.redirect('/');
            }
        });
    }
});

router.get('/logout', function (req, res) {
    req.logout();
    req.flash('success', 'You are now logged out');
    res.redirect('/users/login');
});

router.post('/upload', ensureAuthenticated, upload.single('code'), function (req, res) {
    if (req.file) {
        var fname = req.file.originalname;
        var ext = path.extname(fname);
        if (ext != '.py' && ext != '.c' && ext != '.cpp') {
            var delname = req.file.filename;
            fs.unlinkSync('./uploads/' + delname);
            req.flash('failure', 'Invalid File Type. Upload Only Python , C or C++ Files');
            res.location('/');
            res.redirect('/');
            return;
        }
        if (req.file.size > 1000000) {
            var delname = req.file.filename;
            fs.unlinkSync('./uploads/' + delname);
            req.flash('failure', 'File Too Big. Upload below 1Mb');
            res.location('/');
            res.redirect('/');
            return;
        }
        var comm;
        var code = req.file;
        console.log(ext);
        if (ext == '.py') {
            comm = "pylint " + code.filename;
            console.log("inside pylint");
        }
        if (ext == '.c' || ext == '.cpp') {
            comm = "rats " + code.filename;
            console.log("inside rats");
        }
        var id = req.user;
        //var s= req.user;
        //console.log('user '+ s);
        //console.log("id " + id);
        User.getUserById(id, function (err, foundObject) {
            if (err) {
                console.log("error");
                console.log(err);
            }
            else {
                console.log("found");
                //console.log(foundObject);
                foundObject.codename = code.filename;
                console.log(foundObject);
                User.updateUser(foundObject, function (err, user) {
                    if (err) {
                        console.log("error");
                        console.log(err);
                    }
                    else {
                        console.log('user updated');
                        console.log('Starting directory: ' + process.cwd());
                        try {
                            process.chdir('./uploads');
                            console.log('New directory: ' + process.cwd());
                        }
                        catch (err) {
                            console.log('chdir: ' + err);
                        }
                        child = exec(comm, function (error, stdout, stderr) {
                            console.log('stdout: ' + stdout);
                            req.session['output'] = stdout;
                            req.flash('success', 'Here is your result');
                            res.redirect('/output');
                            //res.render('output', {output: stdout});
                            process.chdir('..');
                            if (error !== null) {
                                console.log('exec error: ' + error);
                            }
                        });
                    }
                })
            }
        });
    }
    else {
        console.log('file not present');
        req.flash('failure', 'No File Not Uploaded');
        res.location('/');
        res.redirect('/');
    }
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/users/login');
}

module.exports = router;

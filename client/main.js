import './main.html';
import '../imports/ui/login-view.html';
import '../imports/ui/confirm-view.html';
import '../imports/ui/submit-view.html';
import '../imports/ui/finish-view.html';
import '../imports/ui/radar-view.html';

import './views/confirm-view';
import './views/login-view.js';
import './views/submit-view.js';
import './views/radar-view.js';

import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import "../node_modules/bootstrap/dist/js/bootstrap.bundle.min";

import {Users} from '../imports/api/keywords.js';
import {DevelopFunctions} from '../imports/api/develop.js';

function getUser() {
    const email = Session.get("email");
    const appId = Session.get("appId");

    var users = Users.find({"$or": [{email: email}, {appIds: appId}]}).fetch();
    if (users && users.length) {
        return users[0];
    }
    return null;
}

function checkFinished() {
    const user = getUser();
    if (user && user.finished) {
        Session.set("isLoggedIn", true);
        Router.go("/finish");
    }
}

function checkConfirmed() {
    const user = getUser();
    if (user && user.agreesTerms) {
        Session.set("isLoggedIn", true);
        Session.set('email', user.email);
        Session.set('name', user.name);
        Router.go("/submit");
    }
}

Router.configure({
    layoutTemplate: 'mainLayout'
});

Router.route('/', function () {
    Router.go('/login');
});

Router.route('/login', function () {
    this.render('login');
});

Router.route('/confirm', function () {
    if (Session.get("isLoggingIn")) {
        checkFinished();
        checkConfirmed();
        this.render('confirm');
    } else {
        Router.go("/");
    }
});

Router.route('/submit', function () {
    if (Session.get("isLoggedIn")) {
        checkFinished();
        this.render('submit');
    } else {
        Router.go("/");
    }
});

Router.route('/finish', function () {
    if (Session.get("isLoggedIn")) {
        this.render('finish');
    } else {
        Router.go("/");
    }
});

Router.route('/radar', function () {
    this.layout('radarLayout');
    this.render('radar');
});

Router.route('/radar/:mode', function () {
    this.layout('radarLayout');

    this.render('radar', {
        data: function () {
            return this.params.mode;
        }
    });
});

Template.registerHelper('isDevMode', DevelopFunctions.isDevMode);

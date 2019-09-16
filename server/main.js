import {Meteor} from 'meteor/meteor';
import {Keywords} from '../imports/api/keywords.js';
import _ from "underscore";

const keywordClassifier = require('/public/keywords.json');

Meteor.startup(() => {
    if (!Keywords.find().fetch().length) {
        initialDatabaseConfiguration(keywordClassifier);
    }

    createServiceConfiguration('facebook', Meteor.settings.public.auth.facebook.appId, Meteor.settings.public.auth.facebook.secret);
    createServiceConfiguration('google', Meteor.settings.public.auth.google.clientId, Meteor.settings.public.auth.google.secret);

    Accounts.onCreateUser((options, user) => {
        if (user.services.google) {
            user.email = user.services.google.email;
        } else if (user.services.facebook) {
            user.email = user.services.facebook.email;
        }
        user.wantsRecruitment = false;
        user.wantsParticipation = false;
        user.agreesTerms = false;
        return user;
    })
});

Meteor.publish('user', function () {
    if (!this.userId) {
        return this.ready();
    }
    return Meteor.users.find({_id: this.userId});
});

Meteor.publish('keywords', function () {
    if (!this.userId) {
        return this.ready();
    }
    return Keywords.find();
});

Meteor.methods({
    updateUser(email, wantsRecruitment, wantsParticipation, agreesTerms) {
        Meteor.users.update(
            {_id: this.userId},
            {
                $set: {
                    email: email,
                    wantsRecruitment: wantsRecruitment,
                    wantsParticipation: wantsParticipation,
                    agreesTerms: agreesTerms
                }
            }
        )
    },
    getSubmittedKeywords() {
        return Keywords.find({votes: {$elemMatch: {userId: this.userId}}}).fetch();
    },
    removeVote(id, stage) {
        Keywords.update(
            {_id: id},
            {$pull: {votes: {userId: this.userId, stage: stage}}});
    },
    addVote(id, stage) {
        Keywords.update(
            {_id: id},
            {$addToSet: {votes: {userId: this.userId, stage: stage, time: Date.now()}}}
        );
    },
    addSuggestion(name, section, stage) {
        Keywords.insert({
            name: name,
            section: section,
            enabled: false,
            votes: [{userId: this.userId, stage: stage, time: Date.now()}]
        });
    },
    removeKeywordAdmin() {
        if (isAdmin(this.userId)) {
            Keywords.remove({_id: id});
        }
    },
    updateKeywordAdmin(id, action) {
        if (isAdmin(this.userId)) {
            Keywords.update({_id: id}, {$set: {enabled: action === 'enable'}});
        }
    },
    removeVoteAdmin(id, userId, stage) {
        if (isAdmin(this.userId)) {
            Keywords.update(
                { _id: id },
                {
                    $pull: {votes: {userId: userId, stage: stage}},
                });
        }
    }
});

function initialDatabaseConfiguration(classifiers) {
    if (!classifiers) {
        throw new Error("No classifiers provided");
    }

    if (Keywords.find().fetch().length) {
        throw new Error("Database is not empty!");
    }

    console.log("Setting up database");

    _.each(classifiers, function (classifier) {
        Keywords.insert({
            name: classifier.name,
            section: classifier.section,
            enabled: true,
            votes: []
        });
    });

    console.log("Database setup finished. Generated entries: ", Keywords.find().fetch())
}

function createServiceConfiguration(service, clientId, secret) {
    ServiceConfiguration.configurations.remove({
        service: service
    });

    if (service === 'facebook') {
        ServiceConfiguration.configurations.insert({
            service: service,
            appId: clientId,
            secret: secret
        })
    } else {
        ServiceConfiguration.configurations.insert({
            service: service,
            clientId: clientId,
            secret: secret
        })
    }
}

function isAdmin(userId) {
    if (!userId) {
        return false;
    }
    const user = Meteor.users.findOne({_id: userId});
    return user && user.admin;
}

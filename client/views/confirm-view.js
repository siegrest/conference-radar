import {Template} from 'meteor/templating';
import {Users} from '../../imports/api/keywords.js';
import {UserValidation} from '../../imports/api/constants.js';

Template.confirm.onCreated(function () {
    this.invalidInput = new ReactiveVar();
});

Template.confirm.events({
    'click #nextButton': function (event, template) {

        event.preventDefault();

        const signUpDetails = Session.get('signUpDetails');
        const submitEmail = signUpDetails.email || template.$("#emailText").val();
        const submitName = signUpDetails.name || template.$("#nameText").val();
        const recruitmentChecked = template.$('#recruitmentCheck').is(':checked');
        const participateChecked = template.$('#participateCheck').is(':checked');
        const termsChecked = template.$('#termsCheck').is(':checked');

        if (!submitEmail || !UserValidation.email.test(submitEmail.toLowerCase())) {
            template.invalidInput.set("Invalid email");
            $("#toast").toast("show");
            return;
        }

        if (!submitName || !UserValidation.name.test(submitName)) {
            template.invalidInput.set("Invalid name");
            $("#toast").toast("show");
            return;
        }

        if (!termsChecked) {
            template.invalidInput.set("You must accept the terms before proceeding");
            $("#toast").toast("show");
            return;
        }

        const matchingUser = Users.findOne({email: submitEmail});
        if (!matchingUser) {
            Users.insert({
                appIds: [signUpDetails.appId],
                name: submitName,
                email: submitEmail,
                wantsRecruitment: recruitmentChecked,
                wantsParticipation: participateChecked,
                agreesTerms: termsChecked
            });
        } else {
            Users.update(
                {_id: matchingUser._id},
                {
                    $addToSet: {appIds: signUpDetails.appId},
                    $set: {
                        wantsRecruitment: recruitmentChecked,
                        wantsParticipation: participateChecked
                    }
                }
            );
        }

        const userDetails = Users.findOne({email: submitEmail});
        Session.set('user', userDetails);
        Router.go('/submit');
        Session.set('signUpDetails', undefined);
    }
});

Template.confirm.helpers({
    isDisabled: function (key) {
        const details = Session.get('signUpDetails');
        return details && details[key] ? 'disabled' : '';
    },
    getInvalidInput: function () {
        return Template.instance().invalidInput.get();
    },
    getDetails: function (key) {
        const details = Session.get('signUpDetails');
        return details ? details[key] : '';
    }
});

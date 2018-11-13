import { Template } from 'meteor/templating';
import { Keywords } from '../../imports/api/keywords.js';
import { Guests } from '../../imports/api/keywords.js';

function makeid() {
    var text = "";
    var possible = "AB";

    for (var i = 0; i < 4; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function getRandom(start, max) {
    return Math.floor(Math.random() * max) + start;
}

function getRandomStage() {
    var rand = getRandom(0, 4);
    if (rand === 0) {
        return "Adopt";
    } else if (rand === 1) {
        return "Trial";
    } else if (rand === 2) {
        return "Assess";
    } else {
        return "Avoid";
    }
}

function getRandomSection() {
    var rand = getRandom(0, 4);
    if (rand === 0) {
        return "Tools";
    } else if (rand === 1) {
        return "Techniques";
    } else if (rand === 2) {
        return "Platforms";
    } else {
        return "Frameworks";
    }
}

Template.submit.events({
    'click #submitButton'(event, template) {
        // Prevent default browser form submit
        event.preventDefault();

        var newKeyword = template.$("#keywordText").val();
        var chosenStage = template.$("#stageDropdown").val();
        var chosenSection = template.$("#sectionDropdown").val();

        var keyword = Keywords.find({ keyword: newKeyword, stage: chosenStage, section: chosenSection }).fetch();
        if (chosenStage !== null && chosenSection !== null) {
            if (keyword.length > 0) {
                var voteString = 'votes';
                var action = {};
                action[voteString] = 1;
                console.log("Keyword update");
                Keywords.update(
                    { _id: keyword[0]._id },
                    { $inc: action });
            } else {
                var newKeyword = {
                    keyword: newKeyword,
                    stage: chosenStage,
                    section: chosenSection,
                    votes: 1,
                };
                console.log("Keyword add");
                Keywords.insert(newKeyword);
            }
            
            // Clear form
            template.$('#keywordText').val("");
            template.$("#stageDropdown").val("0");
            template.$("#sectionDropdown").val("0");
        }


        var submitName = template.$('#nameText').val();
        var submitEmail = template.$('#emailText').val();
        var recruitmentChecked = template.$('#recruitmentCheck').is(':checked');
        var participateChecked = template.$('#participateCheck').is(':checked');

        if (submitEmail) {
            var newGuest = {
                name: submitName,
                email: submitEmail,
                wantsRecruitment: recruitmentChecked,
                wantsParticipation: participateChecked,
            };

            Guests.insert(newGuest);

            template.$('#nameText').val("");
            template.$('#emailText').val("");
            template.$('#recruitmentCheck').prop('checked', false);
            template.$('#participateCheck').prop('checked', false);
        }

    },
});
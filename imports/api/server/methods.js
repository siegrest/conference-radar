import {Meteor} from "meteor/meteor";

import {UserInputVerification} from "../shared.js";
import {Keywords} from "../keywords.js";
import "./methods-admin.js";
import "./methods-develop.js"
import {initializeEntries} from "./results";
import {Sections} from "../constants";
import _ from 'underscore';
import {appendLog} from "../logs";

Meteor.methods({
    updateUser(name, email, wantsRecruitment, wantsParticipation, agreesTerms) {
        appendLog('updateUser');
        authorizeUser(this.userId);

        const nameResult = UserInputVerification.verifyName(name);
        const emailResult = UserInputVerification.verifyEmail(email);
        if (!nameResult.ok || !emailResult.ok) {
            return;
        }

        Meteor.users.update(
            {_id: this.userId},
            {
                $set: {
                    name: name,
                    email: email,
                    wantsRecruitment: !!wantsRecruitment,
                    wantsParticipation: !!wantsParticipation,
                    agreesTerms: !!agreesTerms,
                    conference: Meteor.settings.public.conferenceName
                }
            }
        )
    },
    getSubmittedKeywords() {
        appendLog('getSubmittedKeywords');
        authorizeUser(this.userId);
        return Keywords.find({votes: {$elemMatch: {userId: this.userId}}}).fetch();
    },
    removeVote(id, stage) {
        appendLog('removeVote');
        authorizeUser(this.userId);

        const idResult = UserInputVerification.verifyId(id);
        if (!idResult.ok) {
            throw new Meteor.Error(idResult.message, idResult.translate());
        }

        const stageResult = UserInputVerification.verifyStage(stage);
        if (!stageResult.ok) {
            throw new Meteor.Error(stageResult.message, stageResult.translate());
        }

        Keywords.update(
            {_id: id},
            {$pull: {votes: {userId: this.userId, stage: stage}}});
    },
    addVote(id, stage) {
        appendLog('addVote');
        authorizeUser(this.userId);

        const idResult = UserInputVerification.verifyId(id);
        if (!idResult.ok) {
            throw new Meteor.Error(idResult.message, idResult.translate());
        }

        const stageResult = UserInputVerification.verifyStage(stage);
        if (!stageResult.ok) {
            throw new Meteor.Error(stageResult.message, stageResult.translate());
        }

        Keywords.update(
            {_id: id},
            {
                $addToSet: {
                    votes: {
                        userId: this.userId,
                        stage: stage,
                        time: Date.now(),
                        conference: Meteor.settings.public.conferenceName
                    }
                }
            }
        );
    },
    addSuggestion(name, section, stage) {
        appendLog('addSuggestion');
        authorizeUser(this.userId);

        const suggestionResult = UserInputVerification.verifySuggestion(name);
        if (!suggestionResult.ok) {
            return;
        }

        const sectionResult = UserInputVerification.verifySection(section);
        if (!sectionResult.ok) {
            return;
        }

        const stageResult = UserInputVerification.verifyStage(stage);
        if (!stageResult.ok) {
            return;
        }

        Keywords.insert({
            name: name,
            section: section,
            enabled: false,
            votes: [{
                userId: this.userId,
                stage: stage,
                time: Date.now(),
                conference: Meteor.settings.public.conferenceName
            }]
        });
    },
    getResults: function () {
        appendLog('getResults');
        const keywords = Keywords.find({enabled: true}).fetch();
        return initializeEntries(keywords);
    },
    getLastVotes: function () {
        appendLog('getLastVotes');
        const keywords = Keywords.find({enabled: true}).fetch();

        const output = [];
        _.each(Sections, section => {
            const voteData = keywords.filter(kw => kw.section === section.id)
              .filter(kw => kw.votes.length)
              .map(kw => {
                  return kw.votes.map(vote => {
                      return {
                          time: vote.time,
                          stage: vote.stage,
                          keyword: kw.name
                      }
                  });
              });

            const votes = [].concat(...voteData)
              .sort((a,b) => (a.time > b.time) ? -1 : ((b.time > a.time) ? 1 : 0));

            for (let i = 0; i < votes.length; i++) {
                votes[i].index = votes.length - i;
            }

            output.push({
                section: section.id,
                votes: votes.slice(0, 5).reverse()
            });
        });

        return output;
    },
    getVoteCount: function () {
        appendLog('getVoteCount');
        const votes = Keywords.find().fetch()
          .map(kw => kw.votes);
        return [].concat(...votes).length;
    }
});

function authorizeUser(userId) {
    if (!userId) {
        appendLog('unauthorized');
        throw new Meteor.Error('error.unauthorized');
    }
}

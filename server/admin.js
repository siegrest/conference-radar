import {Meteor} from "meteor/meteor";
import {Keywords} from "../imports/api/keywords";

Meteor.methods({
    removeKeywordAdmin(id) {
        if (isAdmin(this.userId)) {
            Keywords.remove({_id: id});
        }
    },
    updateKeywordAdmin(id, action) {
        if (isAdmin(this.userId)) {
            Keywords.update({_id: id}, {$set: {enabled: action === 'enable'}});
        }
    }
});

function isAdmin(userId) {
    if (!userId) {
        return false;
    }
    const user = Meteor.users.findOne({_id: userId});
    return user && user.admin;
}

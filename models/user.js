var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
     email: {
        type: String,
        required: true,
        unique: true
    }
    ,name: {
        type: String,
        required: false,
        unique: false
    },
    gitAcount: {
        type: String,
        required: false,
        unique: false
    },
    password: {
        type: String,
        required: true
    }
});

UserSchema.pre('save', function(next){
    next()

});
UserSchema.post('save', function(next){
    console.log('Successfully saved  user')
});

var Model = mongoose.model('User', UserSchema);
module.exports = Model;
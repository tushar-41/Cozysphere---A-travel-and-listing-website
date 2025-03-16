const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Localpassport= require("passport-local-mongoose");

const userSchema = new Schema({
    email:{
        type:String,
        required:true,
    }
});

userSchema.plugin(Localpassport);

module.exports = mongoose.model("User",userSchema);
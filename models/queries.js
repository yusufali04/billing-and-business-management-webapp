const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: String,
    email: String,
    phone: Number,
    message: String
});


module.exports = mongoose.model('query', userSchema);
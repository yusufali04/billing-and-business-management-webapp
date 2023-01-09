const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const adminSchema = new Schema({
    name: {type: String},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    role: {type: String, default: 'customer'}
}, {timestamps: true});


module.exports = mongoose.model('Admin', adminSchema);
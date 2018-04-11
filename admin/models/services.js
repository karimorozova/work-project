const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

const ServicesSchema = new mongoose.Schema({
    sortIndex: {
        type: Number,
        default: 100,
    },
    title: { 
        type : String, 
        default : '', 
        trim : true 
    },
    source:{
        type: Boolean,
        default: false
    },
    languages: {
        type: Array,
        default: []
    },
    createdAt : { 
        type : Date, 
        default : Date.now 
    }
});

const Services = mongoose.model('Services', ServicesSchema);

module.exports = Services;
const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

const LanguageSchema = new mongoose.Schema({
    lang: { 
        type : String, 
        default : '', 
        trim : true 
    },
    symbol:{
        type: String,
        default: ''
    },
    dialects:{
        type: Array,
        default: [],
    },
    xtrf:{
        type: String,
        default: '',
    },
    direction:{
        type: String,
        default: 'both',
    },
    check: {
        type: Boolean,
        default: false
    },
    createdAt : { 
        type : Date, 
        default : Date.now 
    },
    
});

const Languages = mongoose.model('Language', LanguageSchema);

module.exports = Languages;
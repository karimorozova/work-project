const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UnitSchema = new mongoose.Schema({
	type: {
		type: String,
		default: '',
		trim: true
	},
	steps: [ {
		type: Schema.Types.ObjectId, ref: 'Step'
	} ],
	active: {
		type: Boolean,
		default: true
	},
	editable: {
		type: Boolean,
		default: true
	}
})

const Units = mongoose.model('Units', UnitSchema)

module.exports = Units

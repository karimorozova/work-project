const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InvoicingReportsSchema = new mongoose.Schema({
	reportId: {
		type: String,
		default: '',
		trim: true
	},
	vendor: {
		type: Schema.Types.ObjectId,
		ref: 'Vendors'
	},
	status: {
		type: String,
		default: '',
		trim: true
	},
	steps: [{
		type: Schema.Types.ObjectId,
		ref: 'Projects.steps'
	}],
	firstPaymentDate: {
		type: Date,
		default: new Date()
	},
	lastPaymentDate: {
		type: Date,
		default: new Date()
	},
	file: {
		type: Object,
		default: () => ({})
	},
	createdBy: {
		type: Schema.Types.ObjectId, ref: 'user'
	},
	updatedBy: {
		type: Schema.Types.ObjectId, ref: 'user'
	},
	createAt: {
		type: Date,
		default: new Date()
	},
	updatedAt: {
		type: Date,
		default: new Date()
	}
});

const InvoicingReports = mongoose.model('InvoicingReports', InvoicingReportsSchema);

module.exports = InvoicingReports;
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const InvoicingPayablesArchiveSchema = new mongoose.Schema({
	reportId: {
		type: String,
		default: '',
		trim: true
	},
	zohoBillingId: {
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
	steps: [ {
		type: Schema.Types.ObjectId,
		ref: 'Projects.steps'
	} ],
	firstPaymentDate: {
		type: Date,
		default: new Date()
	},
	lastPaymentDate: {
		type: Date,
		default: new Date()
	},
	paymentDetails: {
		paymentMethod: {
			type: Schema.Types.ObjectId,
			ref: "Vendors.billingInfo.paymentMethods",
			default: null
		},
		file: {
			type: Object,
			default: () => ({})
		},
		expectedPaymentDate: {
			type: Date
		}
	},
	paymentInformation: [ {
		zohoPaymentId: {
			type: String
		},
		paidAmount: {
			type: Number
		},
		unpaidAmount: {
			type: Number
		},
		paymentMethod: {
			type: Object,
			default: null
		},
		paymentDate: {
			type: Date,
			default: ''
		},
		notes: {
			type: String,
			default: ""
		}
	} ],
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
})

const InvoicingPayablesArchive = mongoose.model('InvoicingPayablesArchive', InvoicingPayablesArchiveSchema)

module.exports = InvoicingPayablesArchive
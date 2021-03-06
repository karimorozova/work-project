const { User } = require('../models')

const nodemailer = require('nodemailer')

const env = process.env

const mailTransporter = nodemailer.createTransport({
	host: env.SMTP_HOST,
	port: env.SMTP_PORT,
	secure: JSON.parse(env.SMTP_SECURE),
	auth: {
		user: env.SMTP_USER,
		pass: env.SMTP_PASS
	}
})

const getUserFullName = async (id) => {
	id = id._id !== null ? id : id._id
	const { firstName, lastName } = await User.findOne({ _id: id })
	return `${ firstName } ${ lastName || '' }`
}

const sendEmailFromUser = async function (from, obj, msg) {
	if (!JSON.parse(process.env.IS_EMAIL_NOTIFICATIONS)) return
	if (process.env.EMAIL_NOTIFICATIONS_TO) obj.to = process.env.EMAIL_NOTIFICATIONS_TO
	const sender = await getUserFullName(from)
	return new Promise((res, rej) => {
		let mailOptions = {
			from: `${ sender } translation@pangea.global`,
			to: `${ obj.to }`,
			subject: `${ obj.subject }`,
			text: "",
			html: msg
		}

		mailOptions.attachments = obj.attachments || []
		mailOptions.attachments.push({ filename: 'logo.png', path: './static/email-logo2.png', cid: 'logo@pan' })

		mailTransporter.sendMail(mailOptions, (error, info) => {
			mailTransporter.close()
			if (error) {
				console.log(error)
				rej(error)
			}
			if (info) {
				// console.log('sendEmailFromUser', sender, 'Message sent: %s', info.messageId)
				res(info.messageId)
			} else {
				console.log('Error in sendEmail')
				rej("no message sent")
			}
		})
	})
}

const sendEmail = function (obj, msg, withoutImage = false) {
	if (!JSON.parse(process.env.IS_EMAIL_NOTIFICATIONS)) return
	if (process.env.EMAIL_NOTIFICATIONS_TO) obj.to = process.env.EMAIL_NOTIFICATIONS_TO
	return new Promise((res, rej) => {
		let mailOptions = {
			from: 'translation@pangea.global', // sender address
			to: `${ obj.to }`, // pm@pangea.global list of receivers
			subject: `${ obj.subject }`, // Subject line
			text: "", // plain text body
			html: msg // html body
		}
		mailOptions.attachments = obj.attachments || []
		if (!withoutImage) {
			if (!mailOptions.attachments.map(item => item.filename).includes('logo.png')) {
				mailOptions.attachments.push({ filename: 'logo.png', path: './static/email-logo2.png', cid: 'logo@pan' })
			}
		}
		mailTransporter.sendMail(mailOptions, (error, info) => {
			mailTransporter.close()
			if (error) {
				console.log(error)
				rej(error)
			}
			if (info) {
				console.log('sendEmail() ', 'id' + info.messageId, 'Message sent to:' + obj.to)
				res(info.messageId)
				mailOptions = {}
			} else {
				console.log('Error in sendEmail')
				rej("no message sent")
			}
		})
	})
}

const sendFlexibleEmail = function (mailSettings, msg, withoutImage = false) {
	if (!JSON.parse(process.env.IS_EMAIL_NOTIFICATIONS)) return
	if (process.env.EMAIL_NOTIFICATIONS_TO) mailSettings.to = process.env.EMAIL_NOTIFICATIONS_TO
	return new Promise((res, rej) => {
		let mailOptions = {
			from: `${ mailSettings.nickName } ${ mailSettings.from }`, // sender address
			to: `${ mailSettings.to }`, // pm@pangea.global list of receivers
			subject: `${ mailSettings.subject }`, // Subject line
			text: "", // plain text body
			html: msg // html body
		}
		mailOptions.attachments = mailSettings.attachments || []
		if (!withoutImage) {
			if (!mailOptions.attachments.map(item => item.filename).includes('logo.png')) {
				mailOptions.attachments.push({ filename: 'logo.png', path: './static/email-logo2.png', cid: 'logo@pan' })
			}
		}
		mailTransporter.sendMail(mailOptions, (error, info) => {
			mailTransporter.close()
			if (error) {
				console.log(error)
				rej(error)
			}
			if (info) {
				// console.log('sendEmail', 'Message sent: %s', info.messageId)
				res(info.messageId)
				mailOptions = {}
			} else {
				console.log('Error in sendEmail')
				rej("no message sent")
			}
		})
	})
}

const sendEmailCandidates = function (obj, msg, withoutImage = false) {
	if (!JSON.parse(process.env.IS_EMAIL_NOTIFICATIONS)) return
	if (process.env.EMAIL_NOTIFICATIONS_TO) obj.to = process.env.EMAIL_NOTIFICATIONS_TO
	return new Promise((res, rej) => {
		let mailOptions = {
			from: 'career@pangea.global', // sender address
			to: `${ obj.to }`, // pm@pangea.global list of receivers
			subject: `${ obj.subject }`, // Subject line
			text: "", // plain text body
			html: "<b>" + msg + "</b>" // html body
		}
		mailOptions.attachments = obj.attachments || []
		if (!withoutImage) {
			if (!mailOptions.attachments.map(item => item.filename).includes('logo.png')) {
				mailOptions.attachments.push({ filename: 'logo.png', path: './static/email-logo2.png', cid: 'logo@pan' })
			}
		}
		mailTransporter.sendMail(mailOptions, (error, info) => {
			mailTransporter.close()
			if (error) {
				console.log(error)
				rej(error)
			}
			if (info) {
				// console.log('sendEmail', 'Message sent: %s', info.messageId)
				res(info.messageId)
				mailOptions = {}
			} else {
				console.log('Error in sendEmail')
				rej("no message sent")
			}
		})
	})
}

const clientQuoteToEmails = async function (from, obj, message) {
	if (!JSON.parse(process.env.IS_EMAIL_NOTIFICATIONS)) return
	if (process.env.EMAIL_NOTIFICATIONS_TO) obj.email = process.env.EMAIL_NOTIFICATIONS_TO
	const sender = await getUserFullName(from)
	return new Promise((res, rej) => {
		let mailOptions = {
			from: `${ sender } translation@pangea.global`,
			to: obj.email,
			subject: obj.subject,
			text: "",
			html: message
		}
		mailOptions.attachments = obj.attachments || []
		mailOptions.attachments.push({
			filename: 'logo.png',
			path: './static/email-logo2.png',
			cid: 'logo@pan'
		})
		mailTransporter.sendMail(mailOptions, (error, info) => {
			mailTransporter.close()
			if (error) {
				console.log(error)
				rej(error)
			}
			// const messageId = info && info.messageId ? info.messageId : "Error"
			// console.log('clientQuoteToEmails:', sender, 'To:', obj.email, 'Message sent: %s', messageId)
			res()
		})
	})
}

const clientQuoteEmail = function (obj, msg) {
	if (!JSON.parse(process.env.IS_EMAIL_NOTIFICATIONS)) return
	const contact = !obj.contact ? obj.contacts.find(item => item.leadContact) : obj.contact
	if (process.env.EMAIL_NOTIFICATIONS_TO) contact.email = process.env.EMAIL_NOTIFICATIONS_TO
	return new Promise((res, rej) => {
		let mailOptions = {
			from: 'Michal <michal@pangea.global>',
			to: contact.email,
			subject: obj.subject,
			text: "",
			html: msg
		}
		mailOptions.attachments = obj.attachments || []
		mailOptions.attachments.push({
			filename: 'logo.png',
			path: './static/email-logo2.png',
			cid: 'logo@pan' //same cid value as in the html img src
		})
		mailTransporter.sendMail(mailOptions, (error, info) => {
			mailTransporter.close()
			if (error) {
				console.log(error)
				rej(error)
			}
			// const messageId = info && info.messageId ? info.messageId : "Error"
			// console.log('clientQuoteEmail', 'To:', contact.email, 'Message sent: %s', messageId)
			res()
		})
	})
}

const managerNotifyMail = function (obj, msg, subject) {
	if (!JSON.parse(process.env.IS_EMAIL_NOTIFICATIONS)) return
	if (process.env.EMAIL_NOTIFICATIONS_TO) obj.email = process.env.EMAIL_NOTIFICATIONS_TO
	return new Promise((res, rej) => {
		let mailOptions = {
			from: 'translation@pangea.global',
			to: obj.email,
			subject,
			text: "",
			html: msg
		}
		mailOptions.attachments = obj.attachments || []
		mailOptions.attachments.push({
			filename: 'logo.png',
			path: './static/email-logo2.png',
			cid: 'logo@pan' //same cid value as in the html img src
		})
		mailTransporter.sendMail(mailOptions, (error, info) => {
			mailTransporter.close()
			if (error) {
				rej(error)
			}
			if (info) {
				res(info.messageId)
			} else {
				console.log('Error in sendEmail')
				rej("no message sent")
			}
			// console.log('managerNotifyMail', 'To:', obj.email, 'Message sent: %s', info.messageId)
		})
	})
}

module.exports = { sendEmail, sendFlexibleEmail, clientQuoteEmail, managerNotifyMail, clientQuoteToEmails, sendEmailFromUser, sendEmailCandidates }

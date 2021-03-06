const jwt = require('jsonwebtoken')
const path = require("path")
const { User, Vendors, Clients } = require('../models')
const { secretKey } = require('../configs')

const middleware = {
	requiresLogin(req, res, next) {
		if (req.cookies.admin) {
			try {
				const token = req.cookies.admin
				jwt.verify(token, secretKey, async (err, decoded) => {
					if (err) {
						return res.status(403).send(err)
					}
					const user = await User.findOne({ "_id": decoded.user._id })
					if (user) {
						return next()
					} else {
						return res.status(403).send("No such user")
					}
				})
			} catch (err) {
				res.status(401).send(err.message)
			}
		} else {
			const err = new Error('You must be logged in to view this page.')
			err.status = 401
			res.status(401)
			res.send(err.message)
		}
	},

	checkClientContact(req, res, next) {
		if (req.headers['token-header']) {
			try {
				const token = req.headers['token-header']
				jwt.verify(token, secretKey, async (err, decoded) => {
					if (err) {
						return res.status(403).send(err.message)
					}
					const client = await Clients.findOne({ "_id": decoded.clientId })
					if (client) {
						return next()
					} else {
						return res.status(403).send("No such user")
					}
				})
			} catch (err) {
				res.status(401).send(err.message)
			}
		} else {
			const err = new Error('You must be logged in to view this page.')
			err.status = 401
			res.status(401)
			res.send(err.message)
		}
	},

	checkVendor(req, res, next) {
		if (req.headers['token-header']) {
			try {
				const token = req.headers['token-header']
				jwt.verify(token, secretKey, async (err, decoded) => {
					if (err) {
						return res.status(403).send(err.message)
					}
					const vendor = await Vendors.findOne({ "_id": decoded.vendorId })
					if (vendor) {
						return next()
					} else {
						return res.status(403).send("No such user")
					}
				})
			} catch (err) {
				res.status(401).send(err.message)
			}
		} else {
			const err = new Error('You must be logged in to view this page.')
			err.status = 401
			res.status(401)
			res.send(err.message)
		}
	},

	getProjectManageToken(req, res, next) {
		if (req.query['t']) {
			try {
				const token = req.query['t']
				jwt.verify(token, secretKey, async (err, decoded) => {
					if (err) return res.status(403).send(err)
					return next()
				})
			} catch (err) {
				res.status(401).send(err.message)
			}
		} else {
			const err = new Error('Seems like you using wrong link.')
			err.status = 401
			res.status(401)
			res.send(err.message)
		}
	},

	checkRoutes(req, res, next) {
		if (req.originalUrl.includes('pangea-') || '/login' || '/forgot') {
			res.sendFile(path.resolve('./dist/index.html'))
			return
		}
		next()
	}
}

module.exports = middleware

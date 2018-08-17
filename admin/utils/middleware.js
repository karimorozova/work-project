
const middleware = {
    requiresLogin(req, res, next) {
        if (req.session && req.session.userId) {
            return next();
        } else {
            const err = new Error('You must be logged in to view this page.');
            err.status = 401;
            return next(err);
        }
    },

    checkRoutes(url) {
        let routesArray = [
            '/register',
            '/tasks-report',
            '/login',
            '/accountinfo',
            '/dashboard',
            '/recruitment',
            '/vendors',
            '/languages',
            '/clients',
            '/quotes',
            '/projects',
            '/finance',
            '/reports',
            '/translation-request'
        ]
        if(routesArray.indexOf(url) != -1) {
            console.log(url)
            return true;
        } else {
            return false;
        }
    }
}

module.exports = middleware;
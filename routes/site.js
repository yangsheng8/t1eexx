const Router = require('koa-router');
const router = new Router({
	prefix: ''
});

const site = require('../controllers/site');
const captcha = require('../tools/captcha');

router.all('/*', async function(ctx, next){
	console.log('enter site.js');
	ctx.set('x-XSS-Protection',0); //默认浏览器开启1
	// ctx.set(`Content-Security-Policy`,`default-src 'self'`); //CSP  self同域下可以信任
	await next();
});

router.get('/', site.index);
router.get('/post/:id', site.post);
router.post('/post/addComment', site.addComment);
router.get('/ajax/addComment', site.addComment);
router.get('/captcha',captcha.captcha);

module.exports = router;

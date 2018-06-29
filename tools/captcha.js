var captcha ={};
captcha.captcha = async function(ctx,next){
	var ccap = require('ccap');
	var capt = ccap();
	var data = capt.get();
	// data[0];
	ctx.body = data[1];

}
module.exports = captcha;

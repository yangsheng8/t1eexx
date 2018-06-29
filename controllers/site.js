const bluebird = require('bluebird');
const connectionModel = require('../models/connection');

//进行转义
var escapeHtml = function (str) {
	console.log(str);
	// if (!str) return '';
	// str = str.replace(/&/g, '&amp;');
	// str = str.replace(/</g, '&lt;');
	// str = str.replace(/>/g, '&gt;');
	// str = str.replace(/"/g, '&quto;');
	// str = str.replace(/'/g, '&#39;');
	// str = str.replace(/ /g,'&#32;'); 空格不需要转义
	return str;
}

// var escaperForJs = function (str){
// 	if(!str) return '';
// 	str = str.replace(/\\/g,'\\\\');
// 	str = str.replace(/"/g,'\\"');
// 	return str;
// }

//获取文章评论数量
exports.index = async function (ctx, next) {
	const connection = connectionModel.getConnection();
	const query = bluebird.promisify(connection.query.bind(connection));
	const posts = await query(
		'select post.*,count(comment.id) as commentCount from post left join comment on post.id = comment.postId group by post.id limit 10'
	);
	const comments = await query(
		'select comment.*,post.id as postId,post.title as postTitle,user.username as username from comment left join post on comment.postId = post.id left join user on comment.userId = user.id order by comment.id desc limit 10'
	);
	ctx.render('index', {
		posts,
		comments,
		from: escapeHtml(ctx.query.from) || '',
		fromForJs: JSON.stringify(ctx.query.from) || '',
		avatarId: escapeHtml(ctx.query.avatarId) || ''
	});
	connection.end();
};

//替换富文本scripting 标签
var xssFilter = function (html) {
	return html
	if (!html) return '';
	var xss = require('xss');
	var ret = xss(html,{
		whiteList:{
			img:['src'],
			a:['href'],
			font:['size','color']
		},
		onIgnoreTag:function(){
			return '';
		}
	});
	console.log(html, "-----", ret);
	return ret;

}
exports.post = async function (ctx, next) {
	try {
		console.log('enter post');
		var csrfToken = parseInt(Math.random() * 9999999,10);
		ctx.cookies.set('csrfToken',csrfToken);

		const id = ctx.params.id;
		const connection = connectionModel.getConnection();
		const query = bluebird.promisify(connection.query.bind(connection));
		const posts = await query(
			`select * from post where id = "${id}"`
		);
		let post = posts[0];

		const comments = await query(
			`select comment.*,user.username from comment left join user on comment.userId = user.id where postId = "${post.id}" order by comment.createdAt desc`
		);
		comments.forEach(function (comment) {
			comment.content = xssFilter(comment.content);
		})
		if (post) {
			ctx.render('post', {
				post,
				comments,
				csrfToken
			});
		} else {
			ctx.status = 404;
		}
		connection.end();
	} catch (e) {
		console.log('[/site/post] error:', e.message, e.stack);
		ctx.body = {
			status: e.code || -1,
			body: e.message
		};
	}
};

exports.addComment = async function (ctx, next) {
	try {
		var data;
		if(ctx.request.method.toLowerCase() ==='post'){
			data = ctx.request.body;
		}else{
			data = ctx.request.query;
		}
		const connection = connectionModel.getConnection();
		const query = bluebird.promisify(connection.query.bind(connection));
		const result = await query(
			`insert into comment(userId,postId,content,createdAt) values("${ctx.cookies.get('userId')}", "${data.postId}", "${data.content}",${connection.escape(new Date())})`
		);
		if (result) {
			ctx.redirect(`/post/${data.postId}`);
		} else {
			ctx.body = 'DB操作失败';
		}
	} catch (e) {
		console.log('[/site/addComment] error:', e.message, e.stack);
		ctx.body = {
			status: e.code || -1,
			body: e.message
		};
	}
};

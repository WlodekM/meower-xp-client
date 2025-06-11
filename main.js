var loginForm;
var isLoggedIn;
var ws;
var apiURL;
var token;
var posts;
var ulist;
var user;
var replies = [];
if(!WebSocket) {
	var supportsWss = true;
} else {
	var supportsWss = confirm("Does your browser support secure websockets (if unsure click yes/OK, unless youre on an old browser)");
}
var autoRefresh;
var autoRefreshEnabled = false;
var page = 'home';

// Splash reference omg
var splashes = [
	'It runs on everything!',
	'Made with pain and suffering',
	'If you want to suggest PFPs, don\'t',
	"Secretly helping yada turn everyone into catboys",
	"Only 50% stolen ideas!",
	// "Use https://worse.bettermeower.app/ for the best experience ever!.",
	"https://tryitands.ee/.",
	"Guys pizzafox is totally pizzapizza72 (REAL 100% GONE WRONG).",
	"18.283.211, is this you?",
	"the oldest anarchy server in minecraft",
	"hey Vsauce michael here",
	"Hi guys, this is mike. MXPC has been taken down for major security vulnerabilities, sorry!",
	"I have consumed 14 55 gallon drums of high-fructose corn syrup in the past 20 minutes.",
	"600+ lines of pain",
	"ඞ",
	"soup",
	''
]

var shiftHeld;

window.onkeydown = function (e) {
	if (!e) e = window.event;
	shiftHeld = e.shiftKey;
}

window.onkeyup = function (e) {
	if (!e) e = window.event;
	shiftHeld = e.shiftKey;
}

window.onmousemove = function (e) {
	if (!e) e = window.event;
	shiftHeld = e.shiftKey;
}

// https://stackoverflow.com/a/3890175
function linkify(inputText) {
    var replacedText, replacePattern1, replacePattern2, replacePattern3;

    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

    //Change email addresses to mailto:: links.
    replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

    return replacedText;
}

function escapeHTML(str) {
	return str.replace(/\&/g, '&amp;').replace(/\</g, '&lt;').replace(/\n/g, '<br>')
}

function formatDate(d) {
	return d.getHours() + ":" + d.getMinutes() + " " + d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear()
}

var posts_ = {
	home: [],
	livechat: [],
}

document.addEventListener("DOMContentLoaded", function() {
	posts = document.getElementById("posts")
	loginForm = document.getElementById("loginForm")
	document.getElementById('splash').innerHTML = escapeHTML(splashes[Math.floor(Math.random() * (splashes.length - 1))])
	isLoggedIn = false;
	if(supportsWss) {
		ws = new WebSocket("wss://chaos.goog-search.eu.org/")
	} else {
		ws = prompt('server url (enter nothing for localhost:8080') || new WebSocket("ws://127.0.0.1:8080/")
	}
	apiURL = "https://api.meower.org/";
	function addReply(post) {
		replies.push(post)
	}
	function reply(post) {
		document.getElementById("post-content").value = "@" + post.author.username + " " + document.getElementById("post-content").value
	}
	/**
	 * Add post to posts
	 * @param {Object} post the post
	 * @param {String} post._id post id
	 */
	function addPost(post) {
		// console.log(post)
		const elem =
		make("table")
			.class("post")
			.attr("id", 'post-' + post._id)
			.child("tr")
				.child("td")
					.class("post-left")
					.child("img")
						.class("post-pfp")
						.attr("src", post.author.avatar)
						.attr("float", 'left')
						.up()
					.up()
				.child("td")
					.class("post-right")
					.child("div")
						.class("post-header")
						.html(escapeHTML(post.author.username))
						.child("div")
							.class("right")
							.child("span")
								.class("date")
								.html(escapeHTML(formatDate(new Date(post.created * 1000))))
								.up()
							.child("button")
								.class("mention_btn")
								.ev("click", function(){reply(post)})
								.html("mention")
								.up()
							.up()
						.up()
					.for(post.replies || [], reply => 
						make("a")
							.attr("id", '#post-' + reply._id)
							.child("div")
								.class("reply")
								.child("span")
									.class("reply-username")
									.html(reply && reply.author && reply.author.username ? escapeHTML(reply.author.username) : "")
									.up()
								.child("span")
									.html(reply ? escapeHTML(reply.content).slice(0, 47) + "..." : "Deleted")
									.up()
								.up()
					)
					.child("div")
						.html(linkify(escapeHTML(post.content)))
						.up()
					.for(post.attachments || [], attachment => 
							make("a")
								.attr("href", attachment)
								.attr("target", "_blank")
								.child("img")
									.class("post-image")
									.attr("src", attachment)
									// .attr("alt", filename)
									.up()
					)
				.up()
			.up();
		// console.debug(elem)
		posts.insertBefore(elem, posts.firstChild)
	}
	function parseUlist(ulist) {
		var parsed = []
		for (var i = 0; i < Object.keys(ulist).length; i++) {
			parsed.push(Object.keys(ulist)[i])
		}
		return parsed;
	}
	function updateUlist() {
		document.getElementById("ulist").innerHTML = `There are currently ${ulist.length} users online<br>${escapeHTML(ulist.join(", "))}`
	}
	ws.onmessage = function(data) {
		var text = data.data
		console.log('INC', text)
		var parsed = {};
		try {
			parsed = JSON.parse(text)
		} catch (e) {
		}
		// if(!parsed.data && parsed.command != 'greet') return; //TODO: error handling
		if(parsed.command == "ulist") {
			ulist = parseUlist(parsed.ulist);
			updateUlist()
			return;
		};
		if(parsed.listener == "auth" && parsed.error == false) { //TODO: actual listeners
			token = parsed.token;
			isLoggedIn = true;
			return;
		};
		console.log('ball', parsed.command)
		// if(parsed.command)
		if(parsed.command == 'greet') {
			var messages = parsed.messages;
			for (var i = 0; i < messages.length; i++) {
				var message = messages[i];
				posts_['home'].push(message)
				// console.log(message)
			};
			ulist = parseUlist(parsed.ulist)
			updateUlist()
			return;
		};
		if(parsed.command != 'new_post') return;
		// console.debug(parsed.val.post_origin != page)
		var origin = "home";
		if (parsed.data.origin)
			origin = parsed.data.origin;
		if(typeof posts_[origin] == undefined)
			posts_[origin] = [];
		posts_[origin].push(parsed.data)
		if(!isLoggedIn) return;
		console.log(origin, page)
		if(origin != page) return;
		addPost(parsed.data)
	}
	ws.onclose = function (ev) {
		document.getElementById("closed").style = ""
	}
	function enableLoadingText() {
		document.getElementById("loading").style = ""
	}
	function disableLoadingText() {
		document.getElementById("loading").style = "display: none"
	}
	function updateHome() {
		document.getElementById("chat").style = ""
		// document.getElementById("loading").style = ""
		// fetch(apiURL + 'ulist').then(ures => ures.json().then(function (ulistJson) {
		// 	ulist = ulistJson.autoget.map(function (a) {return a._id});
		// 	document.getElementById("ulist").innerHTML = `There are currently ${ulist.length} users online<br>${escapeHTML(ulist.join(", "))}`
		// var res;
		// if(page == "home") {
		// 	res = fetch(apiURL + "home?autoget=1", {
		// 		"method":"GET"
		// 	});
		// } else {
		// 	res = fetch(apiURL + "posts/" + page, {
		// 		"method":"GET",
		// 		"headers": {
		// 			"token": token
		// 		}
		// 	});
		// }
		// res.then(function (resp) {
		// 	resp.json().then(function (json) {
		document.getElementById("loading").style = "display: none"
		// console.log(json)
		try {
			posts_.home.reverse().forEach(function (post) {
				addPost(post)
			})
		} catch (error) {
			addPost({
				_id: "10000000-0000-0000-0000-000000000000",
				created: 0,
				content: "Error while loading posts\n"+error.toString(),
				replies: [],
				attachments: [],
				author: {"username": "MXPC", "avatar": "x"}
			})
		}
		// var postsHtml = json.autoget.map(post => `<div class="post">${escapeHTML(post.u)}: ${escapeHTML(post.p)}</div>`);
		// document.getElementById("posts").innerHTML = postsHtml.join("\n")
		// 	})
		// })
		// }))
	}
	window.updateHome = updateHome
	function doLogin(username, password, cb) {
		ws.send(JSON.stringify({
			command: "login_pswd",
			username: username,
			password: password,
			listener: "auth"
		}));
		cb() //TODO: listeners
	}
	function onLoginFormSubmit(ev) {
		ev.preventDefault();
		// console.log(ev);
		var username = document.getElementById("login-username").value
		var password = document.getElementById("login-password").value
		document.getElementById("error").style = "display: none";
		document.getElementById("loading").style = ""
		doLogin(username, password, function () {
			document.getElementById("loginContainer").style = "display: none"
			document.getElementById("ulist").style = ""
			document.getElementById("postForm").style = ""
			document.getElementById("controls").style = ""
			document.getElementById("chat").style = ""
			document.getElementById("postsContainer").style = ""
			document.getElementById("ulist-container").style = ""
			document.getElementById("auto-refresh").addEventListener("click", toggleRefresh)
			document.title = "MXPC - Home"
			updateHome()
		})
	}
	function toggleRefresh() {
		if(!autoRefreshEnabled) {
			if(!autoRefresh) {
				autoRefresh = setInterval(update, 5000);	 
			}
			autoRefreshEnabled = true;
			document.getElementById("auto-refresh").innerHTML = "Auto refresh: ON"
		} else {
			autoRefreshEnabled = false;
			clearInterval(autoRefresh)
			document.getElementById("auto-refresh").innerHTML = "Auto refresh: OFF"
		}
	}
	function onPostFormSubmit(ev) {
		ev.preventDefault();
		console.log(ev);
		var content = document.getElementById("post-content").value
		if(page == 'home') {
			// fetch(apiURL + "home/", {
			// 	"method":"POST",
			// 	"headers": {
			// 		"content-type": "application/json",
			// 		"token": token,
			// 	},
			// 	"body": JSON.stringify({
			// 		"content":content,
			// 	})
			// }).then(function (resp) {
			// 	resp.json().then(function (json) {
			// 		console.log(json)
			// 	})
			// })
			ws.send(JSON.stringify({
				command: "post",
				content: content,
				attachments: [],
				replies: []
			}))
		} else {
			fetch(apiURL + "posts/" + page, {
				"method":"POST",
				"headers": {
					"content-type": "application/json",
					"token": token,
				},
				"body": JSON.stringify({
					"content":content,
				})
			}).then(function (resp) {
				resp.json().then(function (json) {
					console.log(json)
				})
			})
		}
		replies = [];
		document.getElementById("post-content").value = ""
	}
	function update() {
		if(page == "chats") {
			updateChat()
		} else {
			updateHome();
		}
	}
	loginForm.addEventListener("submit", onLoginFormSubmit)
	document.getElementById("postForm").addEventListener("submit", onPostFormSubmit)
	document.getElementById("refresh").addEventListener("click", function () {
		posts.innerHTML = "<span></span>";
		update()
	})
	document.getElementById("home").addEventListener("click", function () {
		posts.innerHTML = "<span></span>";
		page = "home";
		document.getElementById("pageTitle").innerHTML = escapeHTML("Home")
		updateHome();
		document.title = "MXPC - Home"
	})
	/**
	 * 
	 * @param {Object} chat the chat
	 * @param {String} chat._id chat id
	 * @param {Boolean} chat.allow_pinning allow pinning
	 * @param {Number} chat.created created time (epoch)
	 * @param {Boolean} chat.deleted deleted
	 * @param {Array} chat.emojis emojis
	 * @param {String} chat.icon icon id
	 * @param {String} chat.icon_color icon color (hex)
	 * @param {Number} chat.last_active last active time
	 * @param {String[]} chat.members members
	 * @param {String} chat.nickname nickname
	 * @param {String} chat.owner owner
	 * @param {Array} chat.stickers stickers
	 * @param {1|0} chat.type type
	 */
	function addChat(chat) {
		// console.log(post)
		var elem = document.createElement("div")
		elem.classList.add("post")
		var header = document.createElement("div")
		header.classList.add("post-header")
		header.classList.add("chat-header")
		if(chat.type == 1) {
			header.innerHTML = 'DM with ' + escapeHTML(chat.members.filter(function (member) {return member != user._id})[0])
		} else {
			header.innerHTML = escapeHTML(chat.nickname)
		}
		header.innerHTML += "<span style=\"color: gray;font-size: 0.5em;\">" + escapeHTML(chat._id) + "</span>"
		elem.appendChild(header)
		var postContent = document.createElement("button")
		postContent.innerHTML = escapeHTML('go to chat')
		postContent.addEventListener('click', function () {
			page = chat._id;
			document.getElementById('pageTitle').innerHTML = escapeHTML('Chat')
			posts.innerHTML = "<span></span>";
			updateHome();
		})
		postContent.style = "cursor: pointer";
		elem.appendChild(postContent)
		posts.insertBefore(elem, posts.firstChild)
	}
	function updateChat() {
		document.getElementById("chat").style = "display: none"
		enableLoadingText()
		fetch(apiURL + "chats/", {
			"method":"GET",
			"headers": {
				"token": token,
			}
		}).then(function (resp) {
			resp.json().then(function (json) {
				if(Array.prototype.sort) {
					json.autoget = json.autoget.sort((a, b) => {
						return b.last_active - a.last_active;
					}).reverse();
				}
				for (var i = 0; i < json.autoget.length; i++) {
					addChat(json.autoget[i]);
				}
			})
			disableLoadingText()
		})
	}
	document.getElementById("chats").addEventListener("click", function () {
		posts.innerHTML = "<span></span>";
		document.getElementById('pageTitle').innerHTML = escapeHTML('Chats')
		page = "chats";
		updateChat()
	})
	document.getElementById("post-content").addEventListener("keydown", function (event) {
		var submitBtn = document.getElementById("post-submit");
		if (
			event.key == "Enter" &&
			!shiftHeld
		) {
			event.preventDefault();
			if(!submitBtn.disabled) submitBtn.click();
		}
	})
})

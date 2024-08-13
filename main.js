var loginForm;
var isLoggedIn;
var ws;
var apiURL;
var token;
var posts;
var ulist;
var user;
var replies = [];
var supportsWss = confirm("Does your browser support secure websockets (click yes if on a modern browser)");
var autoRefresh;
var autoRefreshEnabled = false;
var page = 'home';

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

function escapeHTML(str) {
	return str.replace(/\&/g, '&amp;').replace(/\</g, '&lt;').replace(/\n/g, '<br>')
}

document.addEventListener("DOMContentLoaded", function() {
	posts = document.getElementById("posts")
	loginForm = document.getElementById("loginForm")
	isLoggedIn = false;
	if(supportsWss) {
		ws = new WebSocket("wss://server.meower.org/")
	} else {
		ws = new WebSocket("ws://192.168.56.1:8080/")
	}
	apiURL = "https://api.meower.org/";
	function addReply(post) {
		replies.push(post)
	}
	function reply(post) {
		document.getElementById("post-content").value = "@" + post.u + " " + document.getElementById("post-content").value
	}
	function addPost(post) {
		// console.log(post)
		var elem = document.createElement("div")
		elem.classList.add("post")
		var header = document.createElement("div")
		header.classList.add("post-header")
		header.innerHTML = escapeHTML(post.u)
		header.appendChild(document.createElement("div"))
		header.childNodes[1].classList.add("right");
		header.childNodes[1].appendChild(document.createElement("span"))
		header.childNodes[1].children[0].classList.add("date");
		header.childNodes[1].children[0].innerHTML = escapeHTML(new Date(post.t.e * 1000).toString());
		header.childNodes[1].appendChild(document.createElement("button"))
		header.childNodes[1].children[1].classList.add("mention_btn");
		header.childNodes[1].children[1].addEventListener("click", function(){reply(post)})
		header.childNodes[1].children[1].innerHTML = "mention"
		// header.childNodes[1].appendChild(document.createElement("button"))
		// header.childNodes[1].children[1].classList.add("reply_btn");
		// header.childNodes[1].children[1].addEventListener("click", ()=>addReply(post))
		// header.childNodes[1].children[1].innerHTML = "reply"
		elem.appendChild(header)
		if(post.reply_to) {
			post.reply_to.forEach(reply => {
				var replyElem = document.createElement("div")
				replyElem.classList.add("reply")
				replyElem.appendChild(document.createElement("span"))
				replyElem.children[0].classList.add("reply-username");
				replyElem.children[0].innerHTML = escapeHTML(reply.u)
				replyElem.appendChild(document.createElement("span"))
				var replyText = reply.p
				if(replyText.length > 40) {
					replyText = replyText.slice(0, 47) + "..."
				}
				replyElem.children[1].innerHTML = escapeHTML(replyText)
				elem.appendChild(replyElem)
			})
		}
		var postContent = document.createElement("div")
		postContent.innerHTML = escapeHTML(post.p)
		elem.appendChild(postContent)
		if(post.attachments) {
			post.attachments.forEach(attachment => {
				var attElem = document.createElement("a")
				attElem.appendChild(document.createElement("img"))
				attElem.children[0].classList.add("post-image");
				attElem.children[0].alt = attachment.filename;
				attElem.children[0].src = `https://uploads.meower.org/attachments/${attachment.id}/${attachment.filename}`
				attElem.href = `https://uploads.meower.org/attachments/${attachment.id}/${attachment.filename}`
				elem.appendChild(attElem)
			})
		}
		posts.insertBefore(elem, posts.firstChild)
	}
	ws.onmessage = function(data) {
		var text = data.data
		console.log('INC', text)
		var parsed = {};
		try {
			parsed = JSON.parse(text)
		} catch (e) {
		}
		if(!parsed.val) return;
		if(parsed.cmd == "ulist") {
			ulist = parsed.val.split(";");
			document.getElementById("ulist").innerHTML = `There are currently ${ulist.length} users online<br>${escapeHTML(ulist.join(", "))}`
			return;
		};
		if(!isLoggedIn) return;
		if(parsed.val.mode != 1) return;
		console.debug(parsed.val.post_origin != page)
		if(parsed.val.post_origin != page) return;
		addPost(parsed.val)
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
		document.getElementById("loading").style = ""
		var res;
		if(page == "home") {
			res = fetch(apiURL + "home?autoget=1", {
				"method":"GET"
			});
		} else {
			res = fetch(apiURL + "posts/" + page, {
				"method":"GET",
				"headers": {
					"token": token
				}
			});
		}
		res.then(function (resp) {
			resp.json().then(function (json) {
				document.getElementById("loading").style = "display: none"
				// console.log(json)
				json.autoget.reverse().forEach(post => addPost(post))
				// var postsHtml = json.autoget.map(post => `<div class="post">${escapeHTML(post.u)}: ${escapeHTML(post.p)}</div>`);
				// document.getElementById("posts").innerHTML = postsHtml.join("\n")
			})
		})
	}
	function onFormSubmit(ev) {
		ev.preventDefault();
		// console.log(ev);
		var username = document.getElementById("login-username").value
		var password = document.getElementById("login-password").value
		document.getElementById("error").style = "display: none";
		document.getElementById("loading").style = ""
		var res = fetch(apiURL + "auth/login/", {
				"method":"POST",
				"headers": {
					"content-type": "application/json"
				},
				"body": JSON.stringify({
					"username":username,
					"password":password
				})
			});
		res.then(function (resp) {
			resp.json().then(function (json) {
				document.getElementById("loading").style = "display: none"
				if(json.error) {
					document.getElementById("error").style = "";
					document.getElementById("error").innerHTML = "Error: " + escapeHTML(json.type);
					return;
				}
				// console.log(json)
				isLoggedIn = true;
				token = json.token;
				user = json.account;
				loginForm.style = "display: none"
				document.getElementById("ulist").style = ""
				document.getElementById("postForm").style = ""
				document.getElementById("controls").style = ""
				document.getElementById("auto-refresh").addEventListener("click", toggleRefresh)
				document.title = "MXPC - Home"
				updateHome()
			})
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
			fetch(apiURL + "home/", {
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
		if(page == 'home') {
			updateHome();
		} else {
			updateChat()
		}
	}
	loginForm.addEventListener("submit", onFormSubmit)
	document.getElementById("postForm").addEventListener("submit", onPostFormSubmit)
	document.getElementById("refresh").addEventListener("click", function () {
		posts.innerHTML = "<span></span>";
		update()
	})
	document.getElementById("home").addEventListener("click", function () {
		posts.innerHTML = "<span></span>";
		page = "home";
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
			header.innerHTML = escapeHTML(chat.members.filter(function (member) {return member != user._id})[0])
			header.innerHTML += "<span style=\"color: gray;font-size: 0.5em;\">" + escapeHTML(chat._id) + "</span>"
		} else {
			header.innerHTML = escapeHTML(chat.nickname)
		}
		elem.appendChild(header)
		var postContent = document.createElement("div")
		postContent.innerHTML = escapeHTML('go to chat')
		postContent.addEventListener('click', function () {
			page = chat._id;
			posts.innerHTML = "<span></span>";
			updateHome();
		})
		postContent.style = "cursor: pointer";
		elem.appendChild(postContent)
		posts.insertBefore(elem, posts.firstChild)
	}
	function updateChat() {
		enableLoadingText()
		fetch(apiURL + "chats/", {
			"method":"GET",
			"headers": {
				"token": token,
			}
		}).then(function (resp) {
			resp.json().then(function (json) {
				for (let i = 0; i < json.autoget.length; i++) {
					addChat(json.autoget[i]);
				}
			})
			disableLoadingText()
		})
	}
	document.getElementById("chats").addEventListener("click", function () {
		posts.innerHTML = "<span></span>";
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

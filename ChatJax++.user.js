// ==UserScript==
// @name        ChatJax++
// @namespace   https://github.com/vyznev/
// @description Enable MathJax in Stack Exchange chat
// @author      Ilmari Karonen
// @version     0.2.1
// @copyright   2014-2017, Ilmari Karonen (http://stackapps.com/users/10283/ilmari-karonen)
// @license     ISC; http://opensource.org/licenses/ISC
// @match       *://chat.stackexchange.com/*
// @homepageURL https://github.com/vyznev/chatjax
// @updateURL   https://github.com/vyznev/chatjax/raw/master/ChatJax%2B%2B.user.js
// @downloadURL https://github.com/vyznev/chatjax/raw/master/ChatJax%2B%2B.user.js
// @grant       GM_xmlhttpRequest
// @grant       GM_getValue
// @grant       GM_setValue
// @connect     stackexchange.com
// @connect     mathoverflow.net
// ==/UserScript==


// Copyright (C) 2014-2017 Ilmari Karonen.
//
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
// REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
// AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
// INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
// LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
// OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
// PERFORMANCE OF THIS SOFTWARE.

// In addition to the license granted above, I, Ilmari Karonen, to the extent I
// am authorized to do so, and subject to the disclaimer stated above, hereby
// grant Stack Exchange, Inc. permission to make use of this software in any
// way they see fit, including but not limited to incorporating all or parts of
// it within the Stack Exchange codebase, with or without credit to myself.
// This permission grant does not extend to any code written by third parties,
// unless said parties also agree to it.


( function () { try { // start of anonymous wrapper function (needed to restrict variable scope on Opera)

// Old Opera does not support @match, so re-check that we're on SE chat before doing anything
if ( location.hostname != 'chat.stackexchange.com' ) return;

// Loader code, to be run after MathJax config has been fetched from parent site:
var injectChatJax = function ( siteName, siteConfig ) {
	if ( !siteConfig.mathJaxURL || !siteConfig.mathJaxConfig ) {
		console.log( 'ChatJax++: ' + siteName + ' does not seem to have MathJax enabled, stopping' );
		return;
	}

	// Inject MathJax config from parent site, append ChatJax setup:
	var config = siteConfig.mathJaxConfig;
	config.push( "(" + chatJaxSetup + ")()" );
	for (var i = 0; i < config.length; i++) {
		var configScript = document.createElement( 'script' );
		configScript.type = 'text/x-mathjax-config';
		configScript.textContent = config[i];
		document.head.appendChild( configScript );
	}
	config.pop();  // avoid setup script showing up in console when examining config

	// CSS hack to get rid of spurious scroll bars on Firefox/Win:
	var styleHack = document.createElement( 'style' );
	styleHack.type = 'text/css';
	styleHack.textContent = "div.message .full, div.message .partial { padding-bottom: 2px }";
	document.head.appendChild( styleHack );

	// Actually load MathJax:
	var loaderScript = document.createElement( 'script' );
	loaderScript.src = siteConfig.mathJaxURL;
	document.head.appendChild( loaderScript );
};

// Chat polling code, will be injected as a MathJax config script:
var chatJaxSetup = function () {
	if ( !window.CHAT ) return;
	if ( !window.SOUP ) {
		console.log("ChatJax++ TODO: Implement non-SOUP functionality!");
		return;
	}
	SOUP.hookChat( function ( json ) { try {
		var data = JSON.parse( json );
		var room = data['r' + CHAT.CURRENT_ROOM_ID];
		if ( !room || !room.e || !room.e.forEach ) return;
		var seen = {};
		room.e.forEach( function ( e ) {
			var id = null;
			switch ( e.event_type ) {
				// http://paste.ubuntu.com/12785810/
				case 1: case 2: case 20: id = 'message-' + e.message_id; break;
				case 6: id = 'starred-posts'; break;
				case 22: id = 'feed-ticker'; break;
				case 3: case 4: case 8: case 25: case 30: case 34: return;  // ignore user events
				// default: console.log( 'ChatJax++ got unrecognized event', e );
			}
			if ( !id || seen[id] ) return;
			seen[id] = true;

			if ( id != 'starred-posts' ) {
				MathJax.Hub.Queue( ['Typeset', MathJax.Hub, id] );
			} else setTimeout( function () {
				// XXX: for some reason, starred posts need an extra delay :(
				MathJax.Hub.Queue( ['Typeset', MathJax.Hub, id] );
			}, 10 );
		} );
	} catch (e) { console.log( 'ChatJax++ error:', e ); } } );

	// re-typeset content loaded via AJAX to avoid race conditions
	SOUP.hookAjax( /^\/chats\/\d+\/events\b/, function () {
		MathJax.Hub.Queue( ['Typeset', MathJax.Hub ] );
	} );
	SOUP.hookAjax( /^\/chats\/stars\/\d+\b/, function () {
		MathJax.Hub.Queue( ['Typeset', MathJax.Hub, 'starred-posts' ] );
	}, 10 );
	SOUP.hookAjax( /^\/rooms\/thumbs\/\d+\b/, function () {
		MathJax.Hub.Queue( ['Typeset', MathJax.Hub, 'roomdesc' ] );
	}, 10 );

	// also catch expansion of collapsed posts
	var urlRegexp = /^\/messages\/(\d+)\/(\d+)\b/;
	SOUP.hookAjax( urlRegexp, function ( event, xhr, settings ) {
		var match = urlRegexp.exec( settings.url );
		if ( !match || match[1] != CHAT.CURRENT_ROOM_ID ) return;
		MathJax.Hub.Queue( ['Typeset', MathJax.Hub, 'message-' + match[2] ] );
	} );

	// don't parse MathJax in sidebar (except for starred posts and room description)
	var sidebar = document.getElementById('sidebar');
	if (sidebar) sidebar.className += ' tex2jax_ignore';

	MathJax.Hub.Queue( ['Typeset', MathJax.Hub, 'starred-posts' ] );
	MathJax.Hub.Queue( ['Typeset', MathJax.Hub, 'roomdesc' ] );
	console.log( 'ChatJax++ setup complete' );
};

// Extract parent site URL from footer:
var footerLink = document.querySelector('#footer-logo a, #transcript-logo a');
if ( !footerLink ) return;
var match = /^((?:https?:)?\/\/((?:[0-9A-Za-z\-]+\.)*(?:stackexchange\.com|mathoverflow\.net)))(\/|$)/.exec( footerLink.href );
if ( !match ) return;
var parentURL = match[1] + '/404', siteName = match[2];

// Load cached MathJax config data, purge expired entries:
var configCacheKey = 'MathJaxConfigCache';
var configCache = JSON.parse( GM_getValue( configCacheKey ) || "{}" );
var now = Date.now(), newConfigCache = {}, expired = false;
for (var site in configCache) {
	var siteConfig = configCache[site];
	if (siteConfig.disabled || (siteConfig.timeStamp && siteConfig.timeStamp >= now - 60*60*1000)) {
		newConfigCache[site] = siteConfig;
	} else expired = true;
}
if (expired) {
	configCache = newConfigCache;
	GM_setValue( configCacheKey, JSON.stringify( configCache ) );
}

// Check if MathJax config for parent site is cached, otherwise load it:
if ( configCache[siteName] ) {
	console.log( 'ChatJax++ using cached MathJax config for ' + siteName + ':', configCache[siteName] );
	injectChatJax( siteName, configCache[siteName] );
} else {
	console.log( 'ChatJax++ retrieving MathJax config from', parentURL );
	GM_xmlhttpRequest( {
		method: "GET",
		url: parentURL,
		headers: { "Accept": "text/html" },
		onload: function ( response ) { try {
			var parser = new DOMParser();
			var doc = parser.parseFromString( response.responseText, 'text/html' );

			var mathJaxScript = doc.querySelector( 'script[src*="/MathJax.js"]' );
			var configScripts = doc.querySelectorAll( 'script[type="text/x-mathjax-config"]' );

			var siteConfig = { timeStamp: now };
			if ( configScripts.length && mathJaxScript ) {
				siteConfig.mathJaxURL = mathJaxScript.getAttribute('src');
				siteConfig.mathJaxConfig = [];
				for (var i = 0; i < configScripts.length; i++) {
					siteConfig.mathJaxConfig.push( configScripts[i].textContent );
				}
			}

			console.log( 'ChatJax++ caching MathJax config for ' + siteName + ':', siteConfig );
			configCache[siteName] = siteConfig;
			GM_setValue( configCacheKey, JSON.stringify( configCache ) );

			injectChatJax( siteName, siteConfig );
		} catch (e) { console.log( 'ChatJax++ error:', e ); } }
	} );
}

} catch (e) { console.log( 'ChatJax++ error:', e ); } } )();  // end of anonymous wrapper function


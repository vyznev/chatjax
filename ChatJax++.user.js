// ==UserScript==
// @name        ChatJax++
// @namespace   https://github.com/vyznev/
// @description Enable MathJax in Stack Exchange chat
// @author      Ilmari Karonen
// @version     0.1.5
// @copyright   2014-2105, Ilmari Karonen (http://stackapps.com/users/10283/ilmari-karonen)
// @license     ISC; http://opensource.org/licenses/ISC
// @match       *://chat.stackexchange.com/*
// @grant       none
// ==/UserScript==


// Copyright (C) 2014 Ilmari Karonen.
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


( function () {  // start of anonymous wrapper function (needed to restrict variable scope on Opera)

// Opera does not support @match, so re-check that we're on SE chat before doing anything
if ( location.hostname != 'chat.stackexchange.com' ) return;

// TODO: dynamically load config and MathJax URL from main site
var mathJaxURL = "//cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS_HTML-full";
var config = {
	"HTML-CSS": { preferredFont: "TeX", availableFonts: ["STIX","TeX"], linebreaks: { automatic:true }, EqnChunk: 50 },
	tex2jax: { inlineMath: [ ["$", "$"], ["\\\\(","\\\\)"] ], displayMath: [ ["$$","$$"], ["\\[", "\\]"] ], processEscapes: true, ignoreClass: "tex2jax_ignore|dno" },
	TeX: {  noUndefined: { attributes: { mathcolor: "red", mathbackground: "#FFEEEE", mathsize: "90%" } }, Macros: { href: "{}" } },
	messageStyle: "none"
};

// Chat polling code:
var chatJaxSetup = function () {
	if ( !window.MathJax || !window.CHAT ) return;
	if ( !window.SOUP ) {
		console.log("ChatJax++: TODO: Implement non-SOUP functionality!");
		return;
	}
	// Great, we have SOUP!  Just use its chat monitoring feature:
	SOUP.hookChat( function ( json ) {
		try {
			var data = JSON.parse( json );
			var room = data['r' + CHAT.CURRENT_ROOM_ID];
			if ( !room || !room.e || !room.e.forEach ) return;			
			var seen = {};
			room.e.forEach( function ( e ) {
				console.log( 'MathJax++ got event', e );
				var id = null;
				switch ( e.event_type ) {
					case 1: case 2: case 20: id = 'message-' + e.message_id; break;
					case 6: id = 'starred-posts'; break;
				}
				if ( !id || seen[id] ) return;
				seen[id] = true;
				
				if ( id != 'starred-posts' ) {
					MathJax.Hub.Queue( ['Typeset', MathJax.Hub, id] );
				} else setInterval( function () {
					// XXX: for some reason, starred posts need an extra delay :(
					MathJax.Hub.Queue( ['Typeset', MathJax.Hub, id] );
				}, 10 );
			} );
		} catch (err) {
			console.log( "ChatJax++ event hook failed", err );
		}
	} );

	// re-typeset content loaded via AJAX to avoid race conditions
	SOUP.hookAjax( /^\/chats\/\d+\/events\b/, function () {
		MathJax.Hub.Queue( ['Typeset', MathJax.Hub ] );
	} );
	SOUP.hookAjax( /^\/chats\/stars\/\d+\b/, function () {
		MathJax.Hub.Queue( ['Typeset', MathJax.Hub, 'starred-posts' ] );
	}, 10 );
		
	// also catch expansion of collapsed posts
	var urlRegexp = /^\/messages\/(\d+)\/(\d+)\b/;
	SOUP.hookAjax( urlRegexp, function ( event, xhr, settings ) {
		var match = urlRegexp.exec( settings.url );
		if ( !match || match[1] != CHAT.CURRENT_ROOM_ID ) return;
		MathJax.Hub.Queue( ['Typeset', MathJax.Hub, 'message-' + match[2] ] );
	} );
	
	// don't parse MathJax in sidebar (except for starred posts)
	var sidebar = document.getElementById('sidebar');
	if (sidebar) sidebar.className += ' tex2jax_ignore';
	
	MathJax.Hub.Queue( ['Typeset', MathJax.Hub, 'starred-posts' ] );
};

// Inject MathJax config and chat polling code to page:
var configScript = document.createElement( 'script' );
configScript.type = 'text/x-mathjax-config';
configScript.textContent = "MathJax.Hub.Config(" + JSON.stringify(config) + ");\n(" + chatJaxSetup + ")();";
document.head.appendChild( configScript );

// Load MathJax itself:
var mathJaxScript = document.createElement( 'script' );
mathJaxScript.src = mathJaxURL;
document.head.appendChild( mathJaxScript );

} )();  // end of anonymous wrapper function

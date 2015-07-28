ChatJax++
=========

ChatJax++ is a user script to enable MathJax in Stack Exchange chat.  It aims to be an easier, faster and more lightweight alternative to [RobJohn's ChatJax bookmarklets](http://www.math.ucla.edu/~robjohn/math/mathjax.html).

Some notable features of ChatJax++ include:

* As a user script, ChatJax++ runs automatically when you open chat.  There's no need to click a separate bookmark to turn on MathJax.
* As of v0.1.8, ChatJax++ only runs in chat rooms belonging to [sites that use MathJax](http://meta.stackexchange.com/a/216607).  Thus, you don't need to worry about text in other chat rooms getting messed up.  Also, text from other rooms shown in the sidebar will not be parsed for MathJax.
* ChatJax++ also knows about the differences in MathJax config between sites.  For example, the *mhchem* extension is automatically enabled for the [Chemistry](http://chemistry.stackexchange.com) and [Biology](http://biology.stackexchange.com) chats, and alternative `\$` delimiters are automatically used for [Electrical Engineering](http://electronics.stackexchange.com) and [Code Review](http://codereview.stackexchange.com).
* Instead of continually re-processing the whole page, ChatJax++ dynamically processes new chat messages as they arrive.  This should make ChatJax++ more responsive, and minimize its CPU load.  If you like, you can easily have dozens of chat tabs open at the same time, with ChatJax++ running in all of them.

Note that ChatJax++ is still under development.  Some issues to be fixed before v1.0 include:

* ChatJax++ currently requires [SOUP](https://github.com/vyznev/soup) in order to capture chat events.
* There is currently no way to manually enable or disable MathJax in a particular chat room (except by marking the room's URL as excluded in your user script manager).
* There's a possible race condition, where messages that you post yourself may sometimes not display MathJax correctly.  Unfortunately, reliably reproducing this issue seems tricky.

Users with [Greasemonkey](https://addons.mozilla.org/firefox/addon/greasemonkey/) (Firefox) / [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) (Chrome) installed may [install this user script by clicking this link.](https://github.com/vyznev/chatjax/raw/master/ChatJax%2B%2B.user.js)  Remember to also [install SOUP](https://github.com/vyznev/soup/raw/master/SOUP.user.js), if you don't have it already.

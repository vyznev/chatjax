ChatJax++
=========

ChatJax++ is a user script to enable MathJax in Stack Exchange chat.  It aims to be an easier, faster and more lightweight alternative to [RobJohn's ChatJax bookmarklets](http://www.math.ucla.edu/~robjohn/math/mathjax.html).

Note that this user script is still under development.  Some issues to be fixed before v1.0 include:

* ChatJax++ currently requires [SOUP](https://github.com/vyznev/soup) in order to capture chat events.
* ChatJax++ currently runs in all chat rooms, not just those associated with sites using MathJax.
* Also, the MathJax config is hardcoded, so site-specific variations in MathJax syntax are not yet supported.  (As of v0.1.7, the hardcoded config does include mhchem, though.)
* There is currently no way to toggle MathJax processing on and off (except by disabling ChatJax++ in you user script manager and reloading the page).

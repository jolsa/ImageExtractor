var divs = [], loc;

(function ()
{
	"use strict";

	function toDiv(img)
	{
		var org = img;
		//	Remove quotes (if any)
		img = img.replace(/"/g, "");
		//	If it doesn't start with http...
		if (!(/^http/i.test(img)))
		{
			//	Does it start with // ?
			if (/^\/\//.test(img))
			{
				var p = location.protocol;
				//	If protocol is not file or http(s), set it to http (and hope for the best)
				img = (/^(http|file)/i.test(p) ? p : "http:") + img;
			}
			//	Does it start with a / ?
			else if (/^\//.test(img))
				img = location.origin + img;
			else
				//	Otherwise, append to current url
				img = location.href.match(/.*\//)[0] + img;
		}
		return { html: '<div class="image"><img src="' + img + '" alt="img" title="remove" /></div>', original: org };
	}

	loc = { protocol: location.protocol, origin: location.origin, href: location.href };

	//	Find all background images and merge with <img>
	divs = $("*[style]").map(function () { return $(this).css("background-image"); }).get()
			.filter(function (e) { return /url/i.test(e); })
			.map(function (e) { return toDiv(/(.*?url\s*\()(.*?)\).*/i.exec(e)[2]); })
		.concat($("img").map(function () { return $(this).attr("src"); }).get()
			.map(function (e) { return toDiv(e); }));

})();

//	This is how chrome extensions get back the response:
[divs, loc];

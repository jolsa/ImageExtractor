var info = { location: null, divs: null };

(function ()
{
	"use strict";

	//	Cache regex for reuse
	var rxQuotes = /["']/g;
	var rxHttp = /^http/i;
	var rxData = /^data:/i;
	var rxDblSlash = /^\/\//;
	var rxHttpFile = /^(http|file)/i;
	var rxSlash = /.*\//;

	function toImage(imgData)
	{
		var img = $.trim(imgData.text);
		var original = img;
		//	Remove quotes (if any)
		img = img.replace(rxQuotes, "");
		//	If it doesn't start with http(s) or "data:"
		if (!(rxHttp.test(img)) && !(rxData.test(img)))
		{
			//	Does it start with // ?
			if (rxDblSlash.test(img))
			{
				var p = location.protocol;
				//	If protocol is not file or http(s), set it to http (and hope for the best)
				img = (rxHttpFile.test(p) ? p : "http:") + img;
			}
			//	Does it start with a / ?
			else if (/^\//.test(img))
				img = location.origin + img;
			else
				//	Otherwise, append to current url
				img = location.href.match(rxSlash)[0] + img;
		}
		return { img: img, original: original, index: imgData.index, type: imgData.type };
	}

	var all = $("*");
	var loc = $.extend({}, location);
	info.location = loc;

	var rxHasUrl = /url/i;
	var rxParseUrl = /(.*?url\s*\()(.*?)\).*/i;

	//	Find all background images and merge with <img>
	var imgs = $("*[style]").map(function () { var t = $(this); return { text: t.css("background-image"), index: all.index(t) }; }).get()
			.filter(function (e) { return rxHasUrl.test(e.text); })
			.map(function (e) { return toImage({ text: rxParseUrl.exec(e.text)[2], index: e.index, type: "url" }); })
		.concat($("img").map(function () { var t = $(this); return { text: t.attr("src"), index: all.index(t), type: "img" }; }).get()
			.map(function (e) { return toImage(e); }));
	info.imgs = imgs.filter(function (e) { return e.original; });

})();

//	This is how chrome extensions get back the response:
info;

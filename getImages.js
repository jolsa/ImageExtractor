function toDiv(img)
{
	img = img.replace(/"/g, "");
	//	If it doesn't start with http...
	if (!(/^http/i.test(img)))
	{
		//	Is it // ?
		if (/\/\//.test(img))
		{
			//	If not http(s) or file, use http and hope for the best
			var p = location.protocol;
			img = (/^(http|file)/i.test(p) ? p : "http:") + img;
		}
		else
			//	Otherwise, append to current url
			img = location.href.match(/.*\//)[0] + img;
	}
	return '<div><img src="' + img + '" alt="img" title="remove" /></div>';
}

//	Find all images
var divs = $("*[style]").map(function () { return $(this).css("background-image"); }).get()
		.filter(function (e) { return e.toLowerCase().indexOf("url") >= 0; })
		.map(function (e) { return toDiv(/(.*?url\s*\()(.*?)\).*/i.exec(e)[2]); })
	.concat($("img").map(function () { return $(this).attr("src"); }).get()
		.map(function (e) { return toDiv(e); }));

//	This is how chrome extensions get back the response:
divs;
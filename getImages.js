function toDiv(img)
{
	img = img.replace(/"/g, "");
	if (!(/^(http|\/\/)/i).test(img))
		img = location.href.match(/.*\//)[0] + img;
	return '<div><img src="' + img + '" alt="img" title="remove" /></div>';
}

//	Find all images
var divs =  $("*[style]").map(function() { return $(this).css("background-image"); }).get()
		.filter(function(e) { return e.toLowerCase().indexOf("url") >= 0; })
		.map(function(e) { return toDiv(/(.*?url\s*\()(.*?)\).*/i.exec(e)[2]); })
.concat(		$("img").map(function() { return $(this).attr("src"); }).get()
		.map(function(e) { return toDiv(e); }));
divs;

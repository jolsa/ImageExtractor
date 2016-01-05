$(function ()
{

	"use strict";

	var main = $("#main");
	var mainItems = $(".main");
	var cnt = $(".count");
	var imgDiv = $("#images");
	var imgItems = $(".images");
	var loading = $("#loading");
	var closeButton = $("#close");
	var loadButton = $("#load");

	function showImages(response)
	{
		var divs = response[0];

		//	Hide all main elements
		mainItems.hide();
		loading.show();

		//	Append all the divs with images to imgDiv
		imgDiv.find("div").remove();

		divs.forEach(function (e) { $(e).appendTo(imgDiv); });

		var images = $("img", imgDiv);
		var imgs = images.get();
		var toLoad = imgs.length;
		cnt.text(toLoad);
		(function wait()
		{
			//	Wait for images to load
			if (toLoad = imgs.filter(function (e) { return !e.complete; }).length)
			{
				cnt.text(toLoad);
				console.log("waiting");
				setTimeout(wait, 100);
				return;
			}

			loading.hide();

			//	Show width x height
			divs = [];
			images.each(function (ord)
			{
				try
				{
					var i = $(this), p = i.parent(), w = i[0].width, h = i[0].height, src = i[0].src;
					$('<div style="border: 1px solid red;">' + w + " x " + h + " [" + (ord + 1) + '] <a href="' + src + '">' + src + "</a></div>").prependTo(p);
					p.css("cursor", "pointer")
					var item = { div: p, size: { w: w, h: h }, ord: ord };
					divs.push(item);
				}
				catch (e)
				{
					debugger;
				}
			});

			//	Sort by area descending
			divs.sort(function (a, b)
			{
				var area = b.size.w * b.size.h - a.size.w * a.size.h;
				return area || a.ord - b.ord;
			});

			//	Remove items and re-add
			$("> div", imgDiv).detach();
			divs.forEach(function (e) { imgDiv.append(e.div); });
			imgDiv.show();
			imgItems.show();


			//	Click to remove
			imgDiv.find("img, > div > div").click(function ()
			{
				$(this).parent().remove();
			});

			closeButton.click(function ()
			{
				mainItems.show();
				imgItems.hide();
				imgDiv.find("div").remove();
			});

		})();
	}

	loadButton.click(function ()
	{
		chrome.tabs.query({ active: true, currentWindow: true }, function (tabs)
		{
			var id = tabs[0].id;
			chrome.tabs.executeScript(id, { file: "jquery-1.10.2.min.js" }, function ()
			{
				chrome.tabs.executeScript(id, { file: "getImages.js" }, showImages);
			});
		});
	});

});

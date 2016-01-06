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
		//	Get distinct list
		(function ()
		{
			var a = [];
			divs.forEach(function (e)
			{
				var key = e.toLowerCase();
				if (!a[key])
					a[key] = e;
			});
			divs = [];
			for (var p in a)
				divs.push(a[p]);
		})();

		//	Hide all main elements
		mainItems.hide();
		loading.show();

		//	Append all the divs with images to imgDiv
		imgDiv.find("div").remove();

		divs.forEach(function (e) { $(e).appendTo(imgDiv); });

		var images = $("img", imgDiv);
		var imgs = images.get();
		var imageCount = imgs.length;
		cnt.text(imageCount);
		(function wait()
		{
			//	Wait for images to load
			if (imageCount = imgs.filter(function (e) { return !e.complete; }).length)
			{
				cnt.text(imageCount);
				console.log("waiting");
				setTimeout(wait, 100);
				return;
			}

			loading.hide();
			cnt.text(imageCount = imgs.length);

			//	Show width x height
			divs = [];
			images.each(function (ord)
			{
				try
				{
					var i = $(this), p = i.parent(), w = i[0].width, h = i[0].height, src = i[0].src;
					$('<div class="image">' + w + " x " + h + ' [<span/>] <a href="' + src + '">' + src + "</a></div>").prependTo(p);
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
			}).forEach(function (e, ord)
			{
				e.div.find("span").text(ord + 1);
				e.ord = ord;
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
				cnt.text(--imageCount);
			});

			closeButton.click(function ()
			{
				mainItems.show();
				imgItems.hide();
				imgDiv.find("div").remove();
			});

		})();
	}

	function showError(message)
	{
		var msg = $('<div class="alert alert-danger"/>').text(message).appendTo(main);
		setTimeout(function () { msg.remove(); }, 5000);
	}

	loadButton.click(function ()
	{
		chrome.tabs.query({ active: true, currentWindow: true }, function (tabs)
		{
			var url = tabs[0].url;
			if (/^chrome/i.test(url))
			{
				showError("Cannot load images from chrome:// pages.");
				return;
			}
			var id = tabs[0].id;
			chrome.tabs.executeScript(id, { file: "scripts/jquery-1.10.2.min.js" }, function ()
			{
				if (chrome.runtime.lastError)
				{
					showError(chrome.runtime.lastError.message);
					return;
				}
				chrome.tabs.executeScript(id, { file: "getImages.js" }, showImages);
			});
		});
	});

});

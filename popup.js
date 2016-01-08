(function ()
{
	"use strict";

	var imageDiv = $("#images");
	var settings = { errMsgTimeout: 3000, downloadFolder: "Extractor\\" };
	var naming = { ord: 0, date: null, ordLength: 3 };

	function controller($scope, $filter)
	{
		var data = { buttonText: "Load Images", dangerMessage: null, imageCount: null, imgs: null, loaded: false, loading: false };
		$scope.data = data;
		chrome.downloads.onDeterminingFilename.addListener(function (item, suggest)
		{
			//	Left-Pad number with 0
			var num = (++naming.ord).toString();
			if (num.length < naming.ordLength)
				num = Array(naming.ordLength + 1 - num.length).join("0") + num;
			var f = item.filename;
			//	Is there an extension?
			var m = f.match(/.*(\..*)/);
			//	If not, get the mime name
			var ext = (m && m.length > 1 ? m[1] : "." + item.mime.match(/.*\/(.*)/)[1]).toLowerCase();
			if (ext === ".jpeg")
				ext = ".jpg";

			suggest({ filename: settings.downloadFolder + naming.date + " #" + num + ext });

		});
		//	Using this prevents $apply from throwing an error
		$scope.apply = function ()
		{
			if ($scope.$root.$$phase !== "$apply" && $scope.$root.$$phase !== "$digest")
				$scope.$apply();
		};
		$scope.showError = function (message)
		{
			data.dangerMessage = message;
			$scope.apply();
			//	Clear message after timeout
			setTimeout(function ()
			{
				data.dangerMessage = null;
				$scope.apply();
			}, settings.errMsgTimeout);
		};
		$scope.openImage = function (item)
		{
			chrome.tabs.create({ url: item.img.img, active: false });
		};
		$scope.openAll = function ()
		{
			//	Don't "open all" if there are more than 10
			if (!data.imageCount || data.imageCount > 10) return;
			data.imgs.forEach(function (e)
			{
				if (!e.hide)
					chrome.tabs.create({ url: e.img, active: false });
			});
		};
		$scope.saveAll = function ()
		{
			//	Reset the ordinal and timestamp
			naming.ord = 0;
			naming.date = $filter("date")(new Date(), "yyyy-MM-dd HH.mm.ss");
			data.imgs.forEach(function (e)
			{
				if (!e.hide)
					chrome.downloads.download({ url: e.img, saveAs: false });
			});
		};
		$scope.hideImage = function ()
		{
			//	Doing this from ng-Click doesn't seem to work
			data.imageCount--;
		};
		$scope.loadImages = function ()
		{
			chrome.tabs.query({ active: true, currentWindow: true }, function (tabs)
			{
				var id = tabs[0].id;
				//	Inject jQuery first
				chrome.tabs.executeScript(id, { file: "scripts/jquery-1.10.2.min.js" }, function ()
				{
					//	If we can't inject a script, show the message
					if (chrome.runtime.lastError)
					{
						$scope.showError(chrome.runtime.lastError.message);
						return;
					}
					data.loading = true;
					chrome.tabs.executeScript(id, { file: "getImages.js" }, showImages);
				});
			});
		};
		function showImages(response)
		{

			var info = response[0];
			var loc = info.location;
			var divs = info.divs;

			//	Get distinct list
			(function ()
			{
				var a = [];
				divs.forEach(function (e)
				{
					var key = e.img.toLowerCase();
					if (!a[key])
						a[key] = e;
				});
				divs = [];
				for (var p in a)
					divs.push(a[p]);
			})();
			data.imageCount = divs.length;

			data.imgs = divs;
			$scope.apply();

			var imgs = $("img", imageDiv).get();
			//	Wait for images to load
			(function wait()
			{
				if (data.imageCount = imgs.filter(function (e) { return !e.complete; }).length)
				{
					//	Show progress and wait for 100 ms
					$scope.apply();
					setTimeout(wait, 100);
					return;
				}

				//	Get dimensions
				divs.forEach(function (e, i)
				{
					var img = imgs[i];
					e.w = img.width;
					e.h = img.height;
					e.ord = i;
				});
				divs
					//	Sort by size
					.sort(function (a, b)
					{
						var area = b.w * b.h - a.w * a.h;
						return area || a.ord - b.ord;
					})
					//	Reset Ordinals
					.forEach(function (e, ord) { e.ord = ord; });

				//	Show total count
				data.imageCount = divs.length;
				//	Set the flags
				data.loaded = true;
				data.loading = false;
				data.buttonText = "Reload Images";
				$scope.apply();
			})();
		}
	}

	var name = "extractor";
	angular.module(name, []).controller(name, ["$scope", "$filter", controller]);

})();

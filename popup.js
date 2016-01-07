(function ()
{
	"use strict";

	var imageDiv = $("#images");

	function controller($scope, $filter)
	{
		$scope.apply = function ()
		{
			if ($scope.$root.$$phase !== "$apply" && $scope.$root.$$phase !== "$digest")
				$scope.$apply();
		};
		$scope.showError = function (message)
		{
			$scope.dangerMessage = message;
			$scope.apply();
			setTimeout(function ()
			{
				$scope.dangerMessage = null;
				$scope.apply();
			}, 3000);
		};
		$scope.openImage = function (item)
		{
			chrome.tabs.create({ url: item.img.img, active: false });
		};
		$scope.openAll = function ()
		{
			if ($scope.imageCount === 0 || $scope.imageCount > 10) return;
			$scope.imgs.forEach(function (e)
			{
				if (!e.hide)
					chrome.tabs.create({ url: e.img, active: false });
			});
		};
		$scope.saveAll = function ()
		{
			var i = 0;
			var d = $filter("date")(new Date(), "yyyy-MM-dd HH.mm.ss");
			$scope.imgs.forEach(function (e)
			{
				if (!e.hide)
				{
					//	Get everything after the last /
					var m = e.img.match(/.*\/(.*)/);
					var f = m && m.length > 1 ? m[1] : e.img;
					//	If there's a ?, get everthing before it
					m = f.match(/(.*)\?/);
					if (m && m.length > 1)
						f = m[1];
					//	Is there an extension?
					m = f.match(/.*(\..*)/);
					var ext = m && m.length > 1 ? m[1].toLowerCase() : ".jpg";
					if (ext === ".jpeg")
						ext = ".jpg";
					var n = (++i).toString();
					if (n.length < 2)
						n = "0" + n;
					chrome.downloads.download({ url: e.img, filename: "Extractor\\" + d + " #" + n + ext, saveAs: false });
				}
			});
		};
		$scope.closeClick = function ()
		{
			$scope.loading = $scope.loaded = false;
		};
		$scope.hideImage = function ()
		{
			//	Doing this from ng-Click doesn't seem to work
			$scope.imageCount--;
		};
		$scope.loadImages = function ()
		{
			chrome.tabs.query({ active: true, currentWindow: true }, function (tabs)
			{
				var tab = tabs[0];
				var id = tab.id;
				chrome.tabs.executeScript(id, { file: "scripts/jquery-1.10.2.min.js" }, function ()
				{
					if (chrome.runtime.lastError)
					{
						$scope.showError(chrome.runtime.lastError.message);
						return;
					}
					$scope.loading = true;
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
			$scope.imageCount = divs.length;

			$scope.imgs = divs;
			$scope.apply();

			var imgs = $("img", imageDiv).get();
			//	Wait for images to load
			(function wait()
			{
				if ($scope.imageCount = imgs.filter(function (e) { return !e.complete; }).length)
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
				$scope.imageCount = divs.length;
				//	Set the flags
				$scope.loaded = true;
				$scope.loading = false;
				$scope.apply();
			})();
		}
	}

	var name = "extractor";
	angular.module(name, []).controller(name, ["$scope", "$filter", controller]);

})();

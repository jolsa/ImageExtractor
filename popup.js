(function ()
{
	"use strict";

	function controller($scope)
	{
		$scope.showError = function (message)
		{
			$scope.dangerMessage = message;
			setTimeout(function ()
			{
				$scope.dangerMessage = null;
				$scope.$apply();
			}, 3000);
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
			$scope.loading = true;
			chrome.tabs.query({ active: true, currentWindow: true }, function (tabs)
			{
				var tab = tabs[0];
				var id = tab.id;
				chrome.tabs.executeScript(id, { file: "scripts/jquery-1.10.2.min.js" }, function ()
				{
					if (chrome.runtime.lastError)
					{
						$scope.showError(chrome.runtime.lastError.message);
						$scope.loading = false;
						return;
					}
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
			$scope.$apply();

			var imgs = $("#images img").get();
			//	Wait for images to load
			(function wait()
			{
				if ($scope.imageCount = imgs.filter(function (e) { return !e.complete; }).length)
				{
					//	Show progress and wait for 100 ms
					$scope.$apply();
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
				$scope.$apply();
			})();
		}
	}

	var name = "extractor";
	angular.module(name, []).controller(name, ["$scope", controller]);

})();

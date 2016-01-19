(function ()
{
	"use strict";

	var imageDiv = $("#images");

	function controller($scope, $filter, settingsFactory)
	{
		var settings = settingsFactory.settings;
		var naming = $scope.naming = settingsFactory.naming;

		var data = { dangerMessage: null, imageCount: null, imgs: null, loaded: false, loading: false, maxOpen: settings.maxOpen };
		$scope.data = data;

		//	Using this prevents $apply from throwing an error
		$scope.apply = function ()
		{
			if ($scope.$root.$$phase !== "$apply" && $scope.$root.$$phase !== "$digest")
				$scope.$apply();
			};
		chrome.downloads.onDeterminingFilename.addListener(naming.renamer);
		chrome.downloads.onCreated.addListener(function () { setTimeout($scope.apply, 10); });
		$scope.getOpenAllTitle = function ()
		{
			return $scope.canOpenAll() ? "Open each image in a new tab" : "Must be " + data.maxOpen + " or less images shown to Open All.";
		};
		$scope.canOpenAll = function ()
		{
			return data.imageCount && data.imageCount <= data.maxOpen;
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
			//	Don't "open all" if there are more than maxOpen
			if (!data.imageCount || data.imageCount > data.maxOpen) return;
			data.imgs.forEach(function (e)
			{
				if (!e.hide)
					chrome.tabs.create({ url: e.img, active: false });
			});
		};
		$scope.saveAll = function ()
		{
			//	Reset the ordinal and timestamp
			naming.reset();
			data.imgs.forEach(function (e)
			{
				if (!e.hide)
					chrome.downloads.download({ url: e.img, saveAs: false });
			});
		};
		$scope.toNewPage = function()
		{
			chrome.tabs.create({ url: chrome.extension.getURL("content/Images.html"), active: false }, function (tab)
			{
				var selfTabId = tab.id;
				chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab)
				{
					if (changeInfo.status === "complete" && tabId === selfTabId)
					{
						var tabs = chrome.extension.getViews({ type: "tab" });
						tabs[0].renderItems(data.imgs);
						chrome.tabs.update(tabId, { active: true });
					}
				});
			});
		},
		$scope.hideImage = function ()
		{
			//	Doing this from ng-Click doesn't seem to work
			data.imageCount--;
		};
		$scope.loadImages = function ()
		{
			naming.clear();
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
		$scope.resetNames = function ()
		{
			naming.clear();
		}
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
				$scope.apply();
			})();
		}

		$scope.loadImages();
	}

	var name = "extractor";
	angular.module(name, ["settings"]).controller(name, ["$scope", "$filter", "settings", controller]);

})();

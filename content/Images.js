'use strict';

var rendered, items = [];
function renderItems(passedItems) {
	if (rendered) return;
	items = passedItems;
	rendered = true;
}

var elementId = 'urlText';

function copyToClipboard(elementId) {
	var range = document.createRange();
	range.selectNode(document.getElementById(elementId));
	window.getSelection().removeAllRanges(); // clear current selection
	window.getSelection().addRange(range); // to select text
	document.execCommand("copy");
	window.getSelection().removeAllRanges(); // to deselect
}

(function () {

	var name = 'images';
	angular.module(name, ['settings'])
		.controller(name, ['$scope', '$timeout', 'settings', function ($scope, $timeout, settingsFactory) {
			var naming = $scope.naming = settingsFactory.naming;
			var nameTypes = { sequenced: 'Use Sequenced Names', deflt: 'Use Default Names' };
			$scope.defaultNames = false;
			$scope.nameType = nameTypes.deflt;
			$scope.imageCount = 0;
			$scope.borders = false;
			$scope.canShow = false;
			$scope.imgClass = 'stacked';
			$scope.sortBy = 'area';
			$scope.data = [];

			$scope.apply = function () {
				if ($scope.$root.$$phase !== '$apply' && $scope.$root.$$phase !== '$digest')
					$scope.$apply();
			};

			//	Wait until "rendered" is set, then set data to items
			(function wait() {
				if (!rendered) {
					setTimeout(wait, 1);
					return;
				}
				$scope.data = items;
				$scope.imageCount = items.filter(function (e) { return !e.hide; }).length;
				$scope.canShow = !!(items.length - $scope.imageCount);
				$scope.apply();
				chrome.downloads.onDeterminingFilename.addListener(naming.renamer);
				chrome.downloads.onCreated.addListener(function () { setTimeout($scope.apply, 10); });
			})();
			$scope.toggleNames = function () {
				var b = $scope.defaultNames = !$scope.defaultNames;
				$scope.nameType = b ? nameTypes.sequenced : nameTypes.deflt;
				settingsFactory.naming.useDefault = b;
			}
			$scope.sort = function (sortBy) {
				$scope.sortBy = sortBy;
				$scope.data					//	Sort by size
					.sort(function (a, b) {
						var r;
						if (sortBy === 'area')
							r = b.w * b.h - a.w * a.h;
						else if (sortBy === 'width')
							r = b.w - a.w;
						else if (sortBy === 'height')
							r = b.h - a.h;
						else if (sortBy === 'index')
							r = 0;
						return r || a.index - b.index;
					})
					//	Reset Ordinals
					.forEach(function (e, ord) { e.ord = ord; });

			};
			$scope.hideImage = function () {
				$scope.imageCount--;
				$scope.canShow = true;
			};
			$scope.showAll = function () {
				$scope.imageCount = items.length;
				$scope.canShow = false;
				$scope.data.forEach(function (e) { e.hide = false; })
			};
			$scope.toggleBorders = function () {
				$scope.showBorders = !$scope.showBorders;
				if ($scope.showBorders)
					$scope.imgClass += ' imgBorder';
				else
					$scope.imgClass = $scope.imgClass.replace(/ imgBorder/i, '');
			}
			$scope.saveAll = function () {
				//	Reset the ordinal and timestamp
				naming.reset();
				$scope.data.forEach(function (e) {
					if (!e.hide)
						chrome.downloads.download({ url: e.img, saveAs: false });
				});
			};
			$scope.resetNames = function () {
				naming.clear();
			};
			$scope.showUrls = function () {
				$scope.urls = $scope.data.filter(function (i) { return !i.hide; }).map(function (i) { return i.img; }).join('\r\n');
				$scope.urlsVisible = true;
			};
			$scope.copyUrl = function () {
				$scope.timedText = true;
				copyToClipboard(elementId);
				$timeout(function () { data.timedText = false; }, 2000);
			};
			$(document).keydown(function (e) {
				if (e.which === 27) {
					$scope.urlsVisible = false;
					$scope.apply();
				}
			});
		}]);

})();

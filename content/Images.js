"use strict";

var rendered, items = [];
function renderItems(passedItems)
{
	if (rendered) return;
	items = passedItems;
	rendered = true;
}

(function ()
{
	var name = "images";
	angular.module(name, [])
		.controller(name, ["$scope", function ($scope)
		{
			$scope.data = [];
			//	Wait until "rendered" is set, then set data to items
			(function wait()
			{
				if (!rendered)
				{
					setTimeout(wait, 1);
					return;
				}
				$scope.data = items;
				$scope.$apply();
			})();
		}]);

})();

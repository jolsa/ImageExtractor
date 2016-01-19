angular.module("settings", []).factory("settings", ["$filter", function ($filter)
{
	"use strict";

	var nameOrdLength = 3; // i.e. "... #001.jpg"

	var naming;
	var settings = { errMsgTimeout: 3000, downloadFolder: "Extractor\\", maxOpen: 10, nameOrdLength: nameOrdLength };
	naming =
	{
		ord: 0, dateStamp: null, ordLength: nameOrdLength, cleared: true,
		clear: function ()
		{
			var t = naming;
			t.ord = 0;
			t.dateStamp = null;
			t.cleared = true;
		},
		reset: function ()
		{
			var t = naming;
			var date = new Date();
			t.ord = 0;
			t.dateStamp = $filter("date")(date, "yyyy-MM-dd HH.mm.ss");
			t.cleared = false;
		},
		renamer: function (item, suggest)
		{
			var t = naming;
			if (t.cleared)
				t.reset();
			//	Left-Pad number with 0
			var num = (++t.ord).toString();
			if (num.length < t.ordLength)
				num = Array(t.ordLength + 1 - num.length).join("0") + num;
			var f = item.filename;
			//	Is there an extension?
			var m = f.match(/.*(\..*)/);
			//	If not, get the mime name
			var ext = (m && m.length > 1 ? m[1] : "." + item.mime.match(/.*\/(.*)/)[1]).toLowerCase();
			if (ext === ".jpeg")
				ext = ".jpg";

			suggest({ filename: settings.downloadFolder + t.dateStamp + " #" + num + ext });
		}
	};

	return { settings: settings, naming: naming };

}]);
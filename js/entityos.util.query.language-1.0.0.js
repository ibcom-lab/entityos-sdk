entityos._util.factory.queryLanguage = function (param)
{
	if (app == undefined) {app = {controller: {}}};
	if (app.controller == undefined) {app.controller = {}};

	app.controller['util-query-language-get'] = function (param)
	{
		var site = entityos._util.param.get(param, 'site').value;

		if (site != undefined)
		{
			$.ajax(
			{
				type: 'GET',
				url: '/site/' + site + '/entityos.query.language-3.0.0.json',
				dataType: 'json',
				success: function(data)
				{
					entityos._util.data.set(
					{
						scope: 'util-query-language',
						value: data
					});

					entityos._util.onComplete(param);
				},

				error: function(data) {}			
			});
		}		
	}
}


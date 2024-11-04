/*
	{
    	title: "Util; Search",
  	}

  	//Charting = Chartist; https://gionkunz.github.io/chartist-js/
*/

entityos._util.factory.search = function (param)
{
	entityos._util.controller.add(
	{
		name: 'util-view-search-initialise',
		code: function (param)
		{
			var parentSelector = app._util.param.get(param, 'selector').value;
			var searches = app._util.param.get(param, 'searches').value;
			var context = app._util.param.get(param, 'context').value;
			var cssClass = app._util.param.get(param, 'class', {default: 'col-lg-4'}).value;
			var template = app._util.param.get(param, 'template').value;
			var buttonCaption = app._util.param.get(param, 'buttonCaption', {default: '<i class="fa fa-play"></i>'}).value;
			var autoShow = app._util.param.get(param, 'autoShow', {default: false}).value;
			var sort = app._util.param.get(param, 'sort', {default: true}).value;
			var includeSearch = app._util.param.get(param, 'includeSearch').value;

			if (sort)
			{
				searches = _.sortBy(searches, 'caption');
			}

			var searchText = app.get(
			{
				scope: 'util-view-search',
				context: 'search-text'
			});

			if (_.isSet(searchText))
			{
				searches = _.filter(searches, function (search)
				{
					return (_.includes(_.toLower(search.caption), _.toLower(searchText)) || (_.includes(_.toLower(search.notes), _.toLower(searchText))))
				});

				if (_.isNotSet(includeSearch)) {includeSearch = true};
			}

			if (_.isNotSet(includeSearch))
			{
				includeSearch = (searches.length > 8)
			}

			app.set(
			{
				scope: 'util-view-search-initialise',
				context: 'dataContext',
				value: param
			});

			app.vq.init(parentSelector,
			{
				queue: 'util-view-search-initialise'
			});

			var name = app.get(
			{
				scope: 'util-view-search-show',
				context: 'name'
			});

			var nameUserFilterValues = app.get(
			{
				scope: 'util-view-search-show',
				context: 'nameUserFilterValues',
				valueDefault: 'default'
			});

			if (template == undefined)
			{
				template =
				[
		 			'<div class="{{class}} entityos-click myds-click" data-name="{{name}}" data-controller="{{controller}}"',
                        ' id="{{id}}">',
						'<div class="card mb-4 shadow">',
							'<div class="card-header">',
                                '<h3 class="float-left mb-0">{{caption}}</h3>',
								'<div class="float-right text-secondary">',
		                            '{{icon}}',
	                  	        '</div>',	
							'</div>',
							'<div class="card-body">',
								'<div class="text-secondary">{{notes}}</div>',
							'</div>',
						'</div>',
					'</div>'
				]
			}

			app.vq.add(template,
			{
				queue: 'util-view-search-initialise',
				type: 'template'
			});

			app.vq.add(
			[
				'<div class="container-fluid">',
	    			'<div class="row">'
			],
			{
				queue: 'util-view-search-initialise'
			});

			if (includeSearch)
			{
				app.vq.add(
				[
					'<div class="container-fluid">',
						'<div class="row">',
							'<div class="col-sm-12 mb-1">',
								'<form autocomplete="off">',
									'<div class="form-group">',
										'<input type="text" class="form-control myds-text" placeholder="Search for a report" ',
										' data-scope="util-view-search" data-context="search-text"',
										' data-controller="util-view-search"',
										' id="util-view-search-text"',
										'>',
									'</div>',
								'</form>',
							'</div>',
						'</div>'
				],
				{
					queue: 'util-view-search-initialise'
				});
			}
			
			if (searches.length == 0)
			{
				app.vq.add(
					[
						'<div class="col-12 text-center text-secondary mt-3">',
							'There are no searches that match this search text.',
						'</div>'
					],
					{
						queue: 'util-view-search-initialise'
					});
			}
			else
			{
				app.vq.add(
				[
						'<div class="row">'
				],
				{
					queue: 'util-view-search-initialise'
				});

				_.each(searches, function (search, s)
				{
					if (search.controller == undefined)
					{
						search.controller = 'util-view-search-show'
					}

					if (search.name == undefined)
					{
						search.name = _.kebabCase(search.caption);

						if (context != undefined)
						{
							search.name = context + '-' + search.name
						}
					}
				
					if (search.id == undefined)
					{
						search.id = search.name;
					}

					if (search.notes == undefined) {search.notes = ''}
					if (search.icon == undefined) {search.icon = ''}

					if (search.class == undefined) {search.class = cssClass}
					if (search.context == undefined) {search.context = context}
					if (search.buttonCaption == undefined) {search.buttonCaption = buttonCaption}
					if (search.parentSelector == undefined) {search.parentSelector = parentSelector}

					if (search.userFilterValues == undefined) {search.userFilterValues = {}}

					search._userFilterValues = search.userFilterValues[nameUserFilterValues];

					if (_.has(entityos._util.whoami().mySetup, 'spaceSettings.ui'))
					{
						var searchSetting = _.find(entityos._util.whoami().mySetup.spaceSettings.ui.searches, function (_search)
						{
							return (_search.name == search.name)
						});

						if (searchSetting != undefined)
						{
							if (searchSetting.hidden != undefined)
							{
								search.hidden = (searchSetting.hidden == 'true')
							}

							if (searchSetting.show != undefined)
							{
								search.hidden = !(searchSetting.show == 'true')
							}
						}
					}

					if (search.hidden != true)
					{
						app.vq.add(
						{
							queue: 'util-view-search-initialise',
							useTemplate: true
						},
						search);
					}
				});
			
				app.vq.add(
				[
						'</div>',
					'</div>'
				],
				{
					queue: 'util-view-search-initialise'
				});

			}

			app.set(
			{
				scope: 'util-view-search-initialise',
				context: 'searches',
				value: searches
			});

			if (name != undefined && autoShow)
			{
				app.invoke('util-view-search-show')
			}
			else
			{
				app.vq.render(parentSelector,
				{
					queue: 'util-view-search-initialise'
				});

				$('#util-view-search-text').focus();
				
				if (_.isSet(searchText))
				{
					$('#util-view-search-text').val(searchText);
				}
			}
		}
	});

	entityos._util.controller.add(
	{
		name: 'util-view-search',
		code: function (param)
		{
			param = app.get(
			{
				scope: 'util-view-search-initialise',
				context: 'dataContext'
			});

			app.invoke('util-view-search-initialise', param)
		}
	});

	entityos._util.controller.add(
	{
		name: 'util-view-search-show',
		code: function (param)
		{
			var selector = app._util.param.get(param, 'selector').value;
			var template = app._util.param.get(param, 'template').value;
			var context = app._util.param.get(param, 'context').value;

			var searches = app.get(
			{
				scope: 'util-view-search-initialise',
				context: 'searches'
			});

			var name = app.get(
			{
				scope: 'util-view-search-show',
				context: 'name'
			});

			var userFilters = app.get(
			{
				scope: 'util-view-search-user-filter',
				valueDefault: {}
			});

			var search = _.find(searches, function (search) {return search.name == name});

			if (search == undefined)
			{
				app._util.data.clear(
				{
					scope: 'util-view-search-show',
					context: 'name'
				});

				app._util.data.clear(
				{
					scope: 'util-view-search-show',
					context: 'search'
				});

				app.notify({message: 'Report can not be found (' + name + ')!', type: 'danger'});
			}
			else
			{		
				app.set(
				{
					scope: 'util-view-search-show',
					context: 'search',
					value: search
				});

				if (search.parentSelector != undefined) {selector = search.parentSelector}

				var whoami = app.invoke('util-whoami');

				if (search.footerTemplate == undefined)
				{
					search.footerTemplate = '<div class="text-muted ml-1"><small>A search of {{appname}} by {{logonname}} @ {{datetime}}</small></div>'
				}

				search.footerTemplate = app.vq.apply(
				{
					template: search.footerTemplate,
					data:
					{
						appname: whoami.buildingMe.about.name,
						datetime: moment().format('DD MMM YYYY h:mm a'),
						logonname: whoami.thisInstanceOfMe.user.userlogonname,
						userfirstname: whoami.thisInstanceOfMe.user.firstname,
						userlastname: whoami.thisInstanceOfMe.user.surname
					}
				});

				app.vq.init(selector,
				{
					queue: 'util-view-search-show',
					working: true
				});

				if (_.isArray(search.userFilters))
				{
					app.vq.init(
					{
						queue: 'util-view-search-show-user-filters'
					});

					_.each(search.userFilters, function (userFilter)
					{
						if (userFilter.type == undefined) {userFilter.type = 'text'}

						if (userFilters[userFilter.name] != undefined)
						{
							userFilter.value = userFilters[userFilter.name]
						}

						app.vq.add(
						[
							'<div class="col-sm-4">',
								'<div>',
	          					'<label class="text-secondary mb-1 mt-2 ml-1" for="util-view-search-user-filter-', userFilter.name, '">',
	          						userFilter.caption,
	          					'</label>'
		          		],
		          		{queue: 'util-view-search-show-user-filters'});

						var userFilterValue = _.find(search._userFilterValues, function (userFilterValue) {return userFilterValue.name == userFilter.name});

		              	if (userFilter.type == 'select')
		              	{
		              		if (userFilter.value == undefined && userFilter.data != undefined)
		              		{
		              			var defaultFilter = _.find(userFilter.data, function (data) {return data.default});

		              			if (defaultFilter != undefined) {userFilter.value = {id: defaultFilter.id, text: defaultFilter.text}}
		              		}

		              		if (userFilter.value == undefined && userFilterValue != undefined)
		              		{
		              			userFilter.value = {id: userFilterValue.id, text: userFilterValue.text};
		              		}

					    	app.vq.add(
							[
								'<button type="button" class="btn btn-white btn-sm dropdown-toggle form-control text-left" data-toggle="dropdown" ',
									' style="font-size:0.8rem;"',
									' data-name="', userFilter.name, '"',
									' data-search-name="', search.name, '"',
									' id="util-view-search-user-filter-', userFilter.name, '"',
									' data-id="', userFilter.value.id, '"',
									' aria-expanded="false">',
									'<span class="dropdown-text">', userFilter.value.text, '</span>',
		              			'</button>',
		              			'<ul class="dropdown-menu mt-1"',
		              				' data-context="', userFilter.name, '"',
		              				' data-scope="util-view-search-user-filter"',
											(search.searchOnChange?' data-controller="util-view-search-process"':''),
		              			'>'
		              		],
		              		{queue: 'util-view-search-show-user-filters'});

					    	_.each(userFilter.data, function (data)
					    	{
					    		app.vq.add(
								[
					               '<li>',
					                  '<a href="#" class="entityos-dropdown myds-dropdown" data-id="', data.id + '">',
					                  data.text,
					                  '</a>',
					               '</li>'
					            ],
		              			{queue: 'util-view-search-show-user-filters'});
					         });

					    	app.vq.add(
							[
				              '</ul>'
							],
							{queue: 'util-view-search-show-user-filters'});
						}

						if (userFilter.type == 'text-select')
		              	{
		              		app.vq.add(
							[
				              	'<select class="form-control entityos-text-select myds-text-select disabled"',
				              		' id="util-view-search-user-filter-', userFilter.name, '"',
				              		' data-scope="util-view-search-user-filter"',
				              			(search.searchOnChange?' data-controller="util-view-search-process"':''),
				              		' data-placeholder="Select..."',
						    			' data-context="', userFilter.name, '">',
				              		' ></select>'
				            ],
							{
								queue: 'util-view-search-show-user-filters'
							});
						} 

		              	if (userFilter.type == 'text')
		              	{
		              		if (userFilter.value == undefined && userFilterValue != undefined)
		              		{
		              			userFilter.value = userFilterValue.text;
		              		}

		              		if (userFilter.value == undefined)
		              		{
		              			userFilter.value = ''
		              		}

					    	app.vq.add(
							[
								'<input id="util-view-search-user-filter-', userFilter.name, '" type="text"',
												' class="form-control entityos-text input-sm entityos-enter myds-text input-sm myds-enter"',
                                                ' data-on-enter-route-to="#util-view-search-user-filter-search"',
												' style="font-size:0.8rem;"',
					    						' data-name="', userFilter.name, '"',
					    						' data-search-name="', search.name, '"',
					    						' data-scope="util-view-search-user-filter"',
					    							(search.searchOnChange?' data-controller="util-view-search-process"':''),
					    						' data-value="' + userFilter.value + '"',
					    						' value="' + userFilter.value + '"',
					    						' data-context="', userFilter.name, '">'
							],
							{
								queue: 'util-view-search-show-user-filters'
							});
						}

		              	if (userFilter.type == 'date')
		              	{
		              		if (userFilter.value == undefined && userFilterValue != undefined)
		              		{
		              			if (userFilterValue.date != undefined)
		              			{
		              				userFilter.value = userFilterValue.date;
		              			}
		              			else if (userFilterValue.text != undefined)
		              			{
		              				userFilter.value = userFilterValue.date;
		              			}
		              			else if (userFilterValue.today)
		              			{
		              				userFilter.value = moment().format('D MMM YYYY');
		              			}
		              		}

		              		if (userFilter.value == undefined)
		              		{
		              			userFilter.value = ''
		              		}

					    	app.vq.add(
							[
							  '<div class="input-group date entityos-date myds-date" data-target-input="nearest" id="util-view-search-user-filter-', userFilter.name, '">',
			                  '<input type="text" class="form-control input-sm datetimepicker-input" data-target="#util-view-search-user-filter-', userFilter.name, '"',
			                    	' id="util-view-search-user-filter-input-', userFilter.name, '"',
			                    	' data-scope="util-view-search-user-filter"',
			                    	(search.searchOnChange?' data-controller="util-view-search-process"':''),
			                    	' data-value="' + userFilter.value + '"',
			                    	' value="' + userFilter.value + '"',
			                    	' data-context="', userFilter.name, '"/>',
									'<div class="input-group-append" data-target="#util-view-search-user-filter-', userFilter.name, '" data-toggle="datetimepicker">',
										'<div class="input-group-text"><i class="far fa-calendar-alt"></i></div>',
									'</div>',
								'</div>'
							],
							{
								queue: 'util-view-search-show-user-filters'
							});
						}
							
						app.vq.add(
						[
				    			'</div>',
				    		'</div>'
						],
						{
							queue: 'util-view-search-show-user-filters'
						});
					});
				}

				app.vq.init(
				{
					queue: 'util-view-search-show-user-filters-container'
				});

				app.vq.add(
				[
					'<form autocomplete="off"><div class="card-body bg-light pt-2 pb-3">',
						'<div class="x-container-fluid">',
		    				'<div class="row mb-2">'
				],
				{queue: 'util-view-search-show-user-filters-container'});

				if (search.searchOnChange)
				{
					app.vq.add(app.vq.get({queue: 'util-view-search-show-user-filters'}),
							{queue: 'util-view-search-show-user-filters-container'});
				}
				else
				{
					app.vq.add(
					[
						'<div class="col-10">',
							'<div class="x-container-fluid">',
								'<div class="row">',
									app.vq.get({queue: 'util-view-search-show-user-filters'}),
								'</div>',
							'</div>',
						'</div>',
						'<div class="col-2 pr-3 text-right">'
					],
					{queue: 'util-view-search-show-user-filters-container'});

					if (_.isArray(search.userFilters))
					{
						app.vq.add(
						[
							'<div>' +
								'<button type="button" id="util-view-search-user-filter-search" style="margin-top:26px;"',
									' class="entityos-click myds-click btn btn-default btn-outline btn-block" role="button" data-controller="util-view-search-process">',
	            					'Search',
	           					'</button>',
	           				'</div>'
						],
						{queue: 'util-view-search-show-user-filters-container'});
					}

					if (_.has(search, 'options.select'))
					{
						if (search.options.select != undefined)
						{
							if (search.options.select.controller != undefined && search.options.select.caption != undefined)
							{
								app.vq.add(
								[
									'<button type="button" id="util-view-search-user-filter-search"',
											' class="entityos-click myds-click btn btn-default btn-outline mt-2 btn-block" role="button"' +
											' data-select-controller="' + search.options.select.controller + '"',
											' data-controller="util-view-search-select-init"',
											' data-name="' + search.name + '"',
											' data-context="util-view-search-show-view"',
											(search.data!=undefined?' ' + search.data:''),
											'>',
			            				search.options.select.caption,
			           				'</button>',
								],
								{queue: 'util-view-search-show-user-filters-container'});
							}
						}
					}

					app.vq.add(
					[
           				'</div>'
					],
					{queue: 'util-view-search-show-user-filters-container'});
				}

				app.vq.add(
				[
							'</div>',
		    			'</div>',
		    		'</div></form>'
				],
				{
					queue: 'util-view-search-show-user-filters-container'
				});

				if (template == undefined)
				{
					var whoami = app.invoke('util-whoami');
			
					if (search.export == undefined)
					{
						search.export = 
						{
							controller: 'util-view-search-export',
							asIs: false,
						}
					}
					else
					{
						if (search.export.asIs == undefined)
						{
							search.export.asIs = false
						}	
					}

					if (search.export.controller == undefined)
					{
						if (search.export.asIs)
						{
							search.export.controller = 'util-view-search-export-as-is';
						}
						else
						{
							search.export.controller = 'util-view-search-export';
						}
					}

					if (search.export.filename == undefined)
					{
						search.export.filename = 'export-' + search.name;

						if (_.has(whoami, 'buildingMe.about.prefix'))
						{
							search.export.filename = whoami.buildingMe.about.prefix + '-' + search.export.filename;
						}

						search.export.filename = search.export.filename + '.csv';
					}

					search.containerSelector = '#util-view-search-show-view';

					search.charting = _.isSet(search.chart);

					if (search.charting)
					{
						if (search.chart.controller == undefined)
						{
							search.chart.controller = 'util-view-search-chart-show';
						}
					}

					template =
					[
			 			'<div class="col-lg-12" data-name="{{name}}">',
							'<div class="card shadow">',
								'<div class="card-body">',
                                    '<div class="float-left">',
                                        '<h1 class="', (!_.isEmpty(search.notes)?' mt-0 mb-0':'') , '">{{caption}}</h1>',
									    '<div class="mt-1 text-secondary">{{notes}}</div>',
                                    '</div>',
									'<div class="float-right" data-html2canvas-ignore="true">',
										'<button class="entityos-click myds-click btn btn-default btn-sm" role="button" data-source="close" data-controller="' + context + '">' +
                                        '<i class="fa fa-times fa-fw"></i> Close' +
                                        '</button>',
                                        '<div class="btn-group" role="group">',
                                        '<button class="entityos-click myds-click btn btn-default btn-sm ml-2" role="button" data-controller="', search.export.controller, '"',
                                            ' data-filename="', search.export.filename, '"',
                                            (search.export.scope!=undefined?' data-scope="' + search.export.scope + '"':''),
                                            (search.export.context!=undefined?' data-context="' + search.export.context + '"':''),
                                            '>',
                                            '<i class="fa fa-cloud-download-alt fa-fw"></i>',
                                            '</button>',
                                            '<button class="entityos-pdf myds-pdf btn btn-default btn-sm" role="button" data-selector="', search.selector, '">',
                                            '<i class="far fa-file-pdf fa-fw"></i>',
                                            '</button>',
                                            (search.charting?'<button class="entityos-click myds-click btn btn-default btn-sm" role="button"' +
                                                        ' data-controller="' + search.chart.controller + '"' +
                                                        (search.chart.scope!=undefined?' data-scope="' + search.chart.scope + '"':'') +
                                                        (search.chart.context!=undefined?' data-context="' + search.chart.context + '"':'') +
                                                        ' data-name="' + search.name + '"' +
                                                        ' data-selector="' + search.containerSelector + '">' +
                                            '<i class="far fa-chart-bar fa-fw"></i>' +
                                            '</button>':''),
                                        '</div>',
                                    '</div>',
								'</div>',
								app.vq.get({queue: 'util-view-search-show-user-filters-container'}),
								'<div class="card-body p-0 pl-3" id="util-view-search-show-view">',
								(search.searchOnChange?'':'<div class="px-3 py-4 ml-3"><em class="text-secondary">Set your filters and then click Search.</em></div>'),
								'</div>',
								'<div class="card-footer" id="util-view-search-show-footer">',
									search.footerTemplate,
								'</div>',
							'</div>',
						'</div>'
					]
				}

				app.vq.add(template,
				{
					queue: 'util-view-search-show',
					type: 'template'
				});

				app.vq.add(
				[
					'<div class="container-fluid">',
		    			'<div class="row pb-2">'
				],
				{
					queue: 'util-view-search-show'
				});

				app.vq.add(
				{
					queue: 'util-view-search-show',
					useTemplate: true
				},
				search);

				app.vq.add(
				[
						'</div>',
		    		'</div>'
				],
				{
					queue: 'util-view-search-show'
				});

				app.vq.render(selector,
				{
					queue: 'util-view-search-show'
				});

				entityos._util.view.datepicker({selector: '.entityos-date, .myds-date', format: 'D MMM YYYY', pickerOptions: {buttons: {showClear: true}, useCurrent: false}});
				entityos._util.view.datepicker({selector: '.entityos-date-time, .myds-date-time', format: 'D MMM YYYY LT'});

				_.each(search.userFilters, function (userFilter)
				{
					if (userFilter.type == 'text-select' && userFilter.data != undefined)
					{
						userFilter._param = userFilter.data;
						userFilter._param.container = 'util-view-search-user-filter-' + userFilter.name;
						userFilter._param.controller = 'util-view-search-process';
						userFilter._param.context = userFilter.name;
						userFilter._param.options = {containerCssClass: 'select-sm', allowClear: true, placeholder: 'Select...'};

						var userFilterValue = _.find(search._userFilterValues, function (userFilterValue) {return userFilterValue.name == userFilter.name});

	           		if (userFilterValue != undefined)
	           		{
	           			userFilter.value = {id: userFilterValue.id, text: userFilterValue.text};
	           			userFilter._param.defaultValue = userFilter.value;
	           		}

						app.invoke('util-view-select', userFilter._param);
					}
				});

				$('.entityos-text-select:visible').removeClass('disabled');
				$('.myds-text-select:visible').removeClass('disabled');

				if (search.searchOnChange)
				{
					app.invoke('util-view-search-process', param);
				}
			}
		}
	});

	entityos._util.controller.add(
	{
		name: 'util-view-search-process',
		code: function (param)
		{
			var searches = app.get(
			{
				scope: 'util-view-search-initialise',
				context: 'searches',
				value: searches
			});

			var searchInitialise = app.get(
			{
				scope: 'util-view-search-initialise',
				context: 'dataContext'
			});

			var name = app.get(
			{
				scope: 'util-view-search-show',
				context: 'name'
			});

			var search = _.find(searches, function (search) {return search.name == name});

            if (search._filters == undefined)
            {
                search._filters = _.clone(search.filters);
            }
            else
            {
                search.filters = _.clone(search._filters);
            }

			if (search.processController != undefined)
			{
				param = entityos._util.param.set(param, 'search', search)
				app.invoke(search.processController, param);
			}
			else
			{
				app.invoke('util-view-search-process-show', param)
			}
		}
	});

	app.add(
	{
		name: 'util-view-search-process-show',
		code: function (param)
		{
			var searches = app.get(
			{
				scope: 'util-view-search-initialise',
				context: 'searches',
				value: searches
			});

			var searchInitialise = app.get(
			{
				scope: 'util-view-search-initialise',
				context: 'dataContext'
			});

			var name = app.get(
			{
				scope: 'util-view-search-show',
				context: 'name'
			});

			var search = _.find(searches, function (search) {return search.name == name});

			if (search != undefined)
			{
				if (search.format != undefined)
				{
					if (search.options == undefined)
					{
						search.options = {}
					}

					if (searchInitialise.options != undefined)
					{
						search.options = _.assign(search.options, searchInitialise.options)
					}

					if (search.noDataText != undefined)
					{
						search.options.noDataText = search.noDataText;
					}

					var filters;

					if (search.filterController != undefined)
					{
						app.invoke(search.filterController, filters)
					}
					else
					{
						var dataUserFilters = app.get(
						{
							scope: 'util-view-search-user-filter',
							valueDefault: {}
						});

						// Do user filters

						filters = _.clone(search.filters);
						if (filters == undefined) {filters = []}

						var userFilterValue;

						_.each(search.userFilters, function (userFilter)
						{
							userFilter.value = dataUserFilters[userFilter.name];

							if (userFilter.value == undefined)
							{
								searchUserFilterValue = _.find(search._userFilterValues, function (userFilterValue) {return userFilterValue.name == userFilter.name});

                                if (searchUserFilterValue != undefined)
                                {
                                    if (userFilter.type == 'text')
                                    {
                                        userFilter.value = searchUserFilterValue.text;
                                    }
                                    else if (userFilter.type == 'date')
                                    {
                                        userFilter.value = searchUserFilterValue.date;
                                    }
                                    else
                                    {
                                        userFilter.value = searchUserFilterValue.id;
                                    }
                                }
                            }

							if (userFilter.storage != undefined)
							{	
								if (userFilter.storage.field != undefined
										&& userFilter.value != undefined
										&& userFilter.value != ''
										&& userFilter.value != 'undefined')
								{
                                    if (userFilter.storage.object == undefined || userFilter.storage.object == search.object)
                                    {
                                        if (userFilter.storage.comparison == undefined)
                                        {
                                            if (userFilter.type == 'text')
                                            {
                                                userFilter.storage.comparison = 'TEXT_IS_LIKE';
                                            }
                                            else
                                            {
                                                userFilter.storage.comparison = 'EQUAL_TO';
                                            }
                                        }

                                        userFilter._filters =
                                        {
                                            field: userFilter.storage.field,
                                            comparison: userFilter.storage.comparison,
                                            value: userFilter.value
                                        }

                                        if (userFilter.controller != undefined)
                                        {
                                            app.invoke(userFilter.controller, userFilter, filters);
                                        }
                                        else
                                        {
                                            filters.push(userFilter._filters)
                                        }
                                    }
								}
							}

                            if (userFilter.filters != undefined)
							{	
                                
                                _.each(userFilter.filters, function (filter)
                                {
                                    if (filter.object == undefined || filter.object == search.object)
                                    {
                                        if (filter.field != undefined
                                                && userFilter.value != undefined
                                                && userFilter.value != ''
                                                && userFilter.value != 'undefined')
                                        {
                                            if (filter.comparison == undefined)
                                            {
                                                if (userFilter.type == 'text')
                                                {
                                                    filter.comparison = 'TEXT_IS_LIKE';
                                                }
                                                else
                                                {
                                                    filter.comparison = 'EQUAL_TO';
                                                }
                                            }

                                            var _filter =
                                            {
                                                field: filter.field,
                                                comparison: filter.comparison
                                            }

                                            if (filter.comparision != 'IS_NULL')
                                            {
                                                _filter.value = userFilter.value
                                            }

                                            if (filter.controller != undefined)
                                            {
                                                app.invoke(filter.controller, userFilter, _filter);
                                            }

                                            filters.push(_filter)
                                        }

                                        if (filter.name != undefined 
                                            && userFilter.value != undefined
                                            && userFilter.value != ''
                                            && userFilter.value != 'undefined')
                                        {
                                            filters.push(filter)
                                        }
                                    }
                                });
							}
						});
					}

					app.invoke('util-view-table',
					{
						container: 'util-view-search-show-view',
						context: 'util-view-search-show-view',
						object: search.object,
						filters: filters,
						options: search.options,
						format: search.format
					});
				}
			}
		}
	});

	entityos._util.controller.add(
	{
		name: 'util-view-search-export',
		code: function (param)
		{
			app.invoke('util-export-table',
			{
				scope: 'util-view-search-show-view',
				filename: param.dataContext.filename + '-' + moment().format('DDMMMYYYY-HHmm').toUpperCase() + '.csv'
			});
		}
	});

	entityos._util.controller.add(
	{
		name: 'util-view-search-export-as-is',
		code: function (param)
		{
			var scope = entityos._util.param.get(param.dataContext, 'scope').value;
			var context = entityos._util.param.get(param.dataContext, 'context').value;
			var filename = entityos._util.param.get(param.dataContext, 'filename').value;

			if (scope == undefined)
			{
				app.notify({messasge: 'No scope set.', type: 'error'});
			}
			else
			{
				app.invoke('util-export-data-as-is-to-csv', 
				{
					scope: scope,
					context: context,
					filename: filename
				});
			}
		}
	});

	entityos._util.controller.add(
	{
		name: 'util-view-search-select-init',
		code: function (param)
		{
			var searches = app.get(
			{
				scope: 'util-view-search-initialise',
				context: 'searches'
			});

			var name = app.get(
			{
				scope: 'util-view-search-show',
				context: 'name'
			});

			var search = _.find(searches, function (search) {return search.name == name});

			entityos._util.data.clear(
			{
				scope: 'util-view-search-select',
				context: 'inputIndex'
			});

			if (search != undefined)
			{
				var context = app._util.param.get(param.dataContext, 'context').value;

				if (context != undefined)
				{
					var inputs = app.set(
					{
						scope: 'util-view-search-select',
						context: 'inputs',
						value: $('[data-context="' + context + '"] input.entityos-view-table-select:checked')
					});

					if (inputs.length != 0)
					{
						app.invoke('util-view-search-select-process');
					}
				}
			}
		}
	});

	entityos._util.controller.add(
	{
		name: 'util-view-search-select-process',
		code: function (param)
		{
			var inputIndex = app.get(
			{
				scope: 'util-view-search-select',
				context: 'inputIndex',
				valueDefault: 0
			});

			var inputs = app.get(
			{
				scope: 'util-view-search-select',
				context: 'inputs'
			});

			var searches = app.get(
			{
				scope: 'util-view-search-initialise',
				context: 'searches'
			});

			var name = app.get(
			{
				scope: 'util-view-search-show',
				context: 'name'
			});

			var search = _.find(searches, function (search) {return search.name == name});

			if (search != undefined)
			{
				if (inputIndex != 0)
				{
					var inputPrevious = inputs[inputIndex - 1];
					$('#' + inputPrevious.id + '-container').html('<i class="far fa-check-circle text-muted"></i>');
				}

				if (inputIndex < inputs.length)
				{
					var input = inputs[inputIndex];

					inputIndex = inputIndex + 1;
					app.set(
					{
						scope: 'util-view-search-select',
						context: 'inputIndex',
						value: inputIndex
					});

					$('#' + input.id + '-container').html('<span class="spinner-border spinner-border-sm entityos-spinner" role="status" aria-hidden="true"></span>');

					app.invoke(search.options.select.controller, input)
				}
				else
				{
					app.invoke('util-view-search-select-finalise')
				}
			}
		}
	});

	app.add(
	{
		name: 'util-view-search-select-finalise',
		code: function (param)
		{
			var searches = app.get(
			{
				scope: 'util-view-search-initialise',
				context: 'searches'
			});

			var name = app.get(
			{
				scope: 'util-view-search-show',
				context: 'name'
			});

			var search = _.find(searches, function (search) {return search.name == name});

			if (search != undefined)
			{
				if (_.has(search, 'options.select.controllerFinalise'))
				{
					app.invoke(search.options.select.controllerFinalise)
				}
			}
		}
	});

	app.add(
	{
		name: 'util-view-search-chart-show',
		code: function (param)
		{	
			console.log(param);

			var scope = entityos._util.param.get(param.dataContext, 'scope').value;
			var context = entityos._util.param.get(param.dataContext, 'context').value;
			var name = entityos._util.param.get(param.dataContext, 'name').value;
		
			var data = app.get(
			{
				scope: scope,
				context: context
			});

			var searches = app.get(
			{
				scope: 'util-view-search-initialise',
				context: 'searches'
			});

			if (name == undefined)
			{
				name = app.get(
				{
					scope: 'util-view-search-show',
					context: 'name'
				});
			}

			var search = _.find(searches, function (search) {return search.name == name});

			if (search != undefined)
			{
				param = {search: search}

				if (search.chart.processController != undefined)
				{
					app.invoke(search.chart.processController, search, data); 
				}
				else
				{
					app.invoke('util-view-search-chart-render', param, data);
				}
			}
		}
	});

	entityos._util.controller.add(
	{
		name: 'util-view-search-chart-render',
		code: function (param, rows)
		{	
			var search = app._util.param.get(param, 'search', {default: {}}).value;
			var setLegend = app._util.param.get(param, 'legend').value;

			if (setLegend == undefined)
			{
				if (search.chart != undefined)
				{
					if (search.chart.legend) {setLegend = true}
				}
			}

			var chartOptions = app._util.param.get(search, 'options', {default: {}}).value;

			if (_.has(search, 'chart.options'))
			{
				chartOptions = _.assign(chartOptions, search.chart.options)
			}

			var containerSelector = app._util.param.get(search, 'containerSelector').value;
			var name = app._util.param.get(search, 'name').value;

			var noDataText = app._util.param.get(search, 'noDataText', {default: '<div class="text-muted">No data.</div>'}).value;

			var chartData = app._util.param.get(param, 'chartData').value;

			if (chartData == undefined && _.has(search, 'chart.data'))
			{
				chartData = search.chart.data;
			}

			var fields = app._util.param.get(search.chart, 'fields', {default: {}}).value;
			
			if (containerSelector == undefined && name != undefined)
			{
				containerSelector = '#' + name
			}

			var chartContainerSelector = app._util.param.get(param, 'chartContainerSelector').value;
			var legendContainerSelector = app._util.param.get(param, 'legendContainerSelector').value;

			if (setLegend == undefined)
			{
				setLegend = (legendContainerSelector != undefined)
			}
	
			if (chartContainerSelector == undefined)
			{
				chartContainerSelector = containerSelector;

				if (setLegend)
				{
					chartContainerSelector = chartContainerSelector + '-chart';
				}
			}

			if (setLegend && legendContainerSelector == undefined)
			{
				legendContainerSelector = containerSelector + '-legend'
			}

			if (containerSelector != undefined)
			{
				entityos._util.view.queue.show(containerSelector, 
				[
					'<div id="', _.replace(chartContainerSelector, '#', ''), '"></div>',
					'<div id="',  _.replace(legendContainerSelector, '#', ''), '"></div>'
				]);

				var chartType = app._util.param.get(chartOptions, 'type', {default: 'Bar', remove: true}).value;

				if (rows.length == 0)
				{
					app.show(containerSelector, noDataText);
				}
				else
				{
					var setLabels = true;
					var setSeries = true;

					if (chartData == undefined)
					{
						if (chartType == 'Bar')
						{
							chartData =
							{	
								labels: [],
								series:
								[
									{
										data: []
									}
								]
							}
						}

						if (chartType == 'Pie')
						{
							chartData =
							{	
								labels: [],
								series: []
							}
						}
					}
					else
					{
						if (chartData.labels != undefined) {setLabels = false}
						if (chartData.series != undefined) {setSeries = false}
					}

					var labelsField = fields.labels;
					if (labelsField == undefined)
					{
						if (_.first(rows)['label'] != undefined)
						{
							labelsField = 'label';
						}
						else
						{
							labelsField = _.first(_.keys(_.first(rows)));
						}
					}

					var dataField = fields.data;
					if (dataField == undefined)
					{
						dataField = _.last(_.keys(_.first(rows)));
					}

					var dataField = 'count';

					if (_.has(search, 'chart.fields.data'))
					{
						dataField - search.chart.fields.data;
					}

					rows = _.reverse(_.sortBy(rows, function (row) 
					{
						return numeral(row[dataField]).value()
					}));

					_.each(rows, function (row)
					{
						if (setLabels)
						{
							chartData.labels.push(row[labelsField])
						};

						if (setSeries)
						{
							if (chartType == 'Bar')
							{
								chartData.series[0].data.push(row[dataField])
							}

							if (chartType == 'Pie')
							{
								chartData.series.push(row[dataField])
							}
						};
					});

					if (setLegend)
					{
						var legendView = [];

						var seriesLabels = chartData.labels;

						if (chartType == 'Bar')
						{
							seriesLabels = _.map(chartData.series, 'name');
						}

						if (seriesLabels.length != 0)
						{
							legendView.push('<ul class="ct-legend">');

							_.each(seriesLabels, function (seriesLabel, sL)
							{
								legendView.push('<li class="ct-series-' + (sL + 1) + '" data-legend="' + (sL + 1) + '">' + seriesLabel + '</li>');
							});

							legendView.push('</ul>');

							if (legendContainerSelector == undefined)
							{
								legendContainerSelector = search.containerSelector + '-legend'
							}

							app.show(legendContainerSelector, legendView.join(''));
						}
					}

					if (search.chart.showAsPercentage)
					{
						var sum = _.sum(chartData.series);

						chartOptions.labelInterpolationFnc = function(value, index)
						{
							return Math.round(chartData.series[index] / sum * 100) + '%';
						}
					}

					if (search.chart.showAsPercentageValue)
					{
						var sum = _.sum(chartData.series);

						chartOptions.labelInterpolationFnc = function(value, index)
						{
							return Math.round(chartData.series[index] / sum * 100) + '% (' + chartData.series[index] + ')'
						}
					}

					if (app._util.controller.exists('util-view-chart-render'))
					{
						app.invoke('util-view-chart-render',
						{
							containerSelector: chartContainerSelector,
							type: chartType,
							options: chartOptions,
							data: chartData,
							_search: search,
							clear: true
						});
					}
					else
					{
						if (_.isObject(Chartist))
						{
							new Chartist[chartType](chartContainerSelector, chartData, chartOptions);
						}
					}
				}
			}
		}
	});

    entityos._util.controller.add(
    {
        name: 'util-view-search-get-filters',
        code: function (param)
        {
            var userFilters = entityos._util.data.get({scope: 'util-view-search-user-filter'});
            var search = entityos._util.data.get(
            {
                scope: 'util-view-search-show',
                context: 'search'
            });

            var object = entityos._util.param.get(param, 'object').value;
			var objectOnly = entityos._util.param.get(param, 'objectOnly', {default: false}).value;
            var includeFixed = entityos._util.param.get(param, 'includeFixed', {default: false}).value;
    
            var searchFilters = [];
    
            _.each(userFilters, function (userFilterValue, userFilterName)
            {
                var userFilter = _.find(search.userFilters, function (userFilter)
                {
                    return userFilter.name == userFilterName
                });
    
                if (_.has(userFilter, 'storage'))
                {
                    if ((userFilter.storage.object == undefined && !objectOnly) || userFilter.storage.object == object)
                    {
                        searchFilters.push(
                        {
                            field: userFilter.storage.field,
                            comparison: userFilter.storage.comparison,
                            value: userFilterValue
                        });
                    }
                }

                if (_.has(userFilter, 'filters'))
                {	
                   
                    _.each(userFilter.filters, function (filter)
                    {
                        // && userFilter.value != undefined
                        //&& userFilter.value != ''
                        //&& userFilter.value != 'undefined'

                        if (filter.object == undefined || filter.object == object)
                        {
                            if (filter.field != undefined)
                            {
                                if (filter.comparison == undefined)
                                {
                                    if (userFilter.type == 'text')
                                    {
                                        filter.comparison = 'TEXT_IS_LIKE';
                                    }
                                    else
                                    {
                                        filter.comparison = 'EQUAL_TO';
                                    }
                                }

                                var _filter =
                                {
                                    field: filter.field,
                                    comparison: filter.comparison
                                }

                                if (filter.comparision != 'IS_NULL')
                                {
                                    _filter.value = userFilterValue
                                }

                                if (filter.controller != undefined)
                                {
                                    app.invoke(filter.controller, userFilter, _filter);
                                }

                                searchFilters.push(_filter)
                            }

                            /*if (filter.name != undefined 
                                && userFilter.value != undefined
                                && userFilter.value != ''
                                && userFilter.value != 'undefined')
                            */
                            if (filter.name != undefined)
                            {
                                searchFilters.push(filter)
                            }
                        }
                    });
                }
            });

            if (includeFixed)
            {
                searchFilters = _.concat(searchFilters, search.filters)
            }
    
            return searchFilters;
        }
    }); 
}
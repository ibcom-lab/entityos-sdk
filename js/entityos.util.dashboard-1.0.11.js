/*
dashboards = 
[
	{
		name: 'dashboard-hello-contacts',
		notes: '',
		containerSelector: '#dashboard-1',
		template: '<strong>{{count}}</strong>',
		queryController: undefined,
		responseController: undefined,
		storage:
		{
			object: 'contact_person',
			name: 'contact_person',
			fields:
			[
				{name: 'count(id) count'}
			]
		}
]
*/

mydigitalstructure._util.factory.dashboard = function (param)
{
	mydigitalstructure._util.controller.add(
	[
		{
			name: 'util-dashboard',
			code: function (param)
			{
				var dashboards = app._util.param.get(param, 'dashboards').value;

				if (dashboards == undefined)
				{
					dashboards = app.get(
					{
						scope: 'util-dashboard',
						context: 'dashboards'
					});
				}
				else
				{
					app.set(
					{
						scope: 'util-dashboard',
						context: 'dashboards',
						value: dashboards
					});
				}

				if (dashboards != undefined)
				{
					_.each(dashboards, function (dashboard)
					{
						if (!dashboard.disabled)
						{
							app.invoke('util-dashboard-initialise', {dashboard: dashboard});
						}
					});
				}
			}
		},
		{
			name: 'util-dashboard-initialise',
			code: function (param)
			{
				var dashboard = app._util.param.get(param, 'dashboard').value;

				app._util.data.clear(
				{
					scope: 'util-dashboard',
					context: dashboard.name,
					name: 'dataIndex'
				});

				if (_.has(dashboard, 'initialise.controller'))
				{
					//It must invoke util-dashboard-process controller when complete.
					mydigitalstructure._util.controller.invoke(dashboard.initialise.controller, param)
				}
				else
				{
					mydigitalstructure._util.controller.invoke('util-dashboard-process', param);
				}
			}
		},
		{
			name: 'util-dashboard-process',
			code: function (param)
			{
				var dashboard = app._util.param.get(param, 'dashboard').value;

				if (dashboard.queryController != undefined)
				{
					app.invoke(dashboard.queryController, param)
				}
				else if (dashboard.controller != undefined)
				{
					app.invoke(dashboard.controller, param)
				}
				else
				{
					dashboard.storage.callback = 'util-dashboard-render';
					dashboard.storage.callbackParam = param;

					if (dashboard.storage.fields == undefined)
					{
						dashboard.storage.fields = 
						[
							{name: 'count(id) count'}
						]
					}

					mydigitalstructure.cloud.retrieve(dashboard.storage);
				}
			}
		},
		{
			name: 'util-dashboard-render',
			code: function (param, response)
			{
				var dashboard = app._util.param.get(param, 'dashboard').value;

				if (response != undefined)
				{
					var data = response.data.rows;

					if (dashboard.responseController)
					{
						data = app.invoke(dashboard.responseController, param, data)
					}
					else if (!dashboard.multiple && !dashboard.chart)
					{
						data = _.first(response.data.rows);
						if (data == undefined) {data = {}}
						data._rows = response.data.rows.length;

						if (response.summary != undefined)
						{
							_.each(response.summary, function (summaryValue, summaryKey)
							{
								data['_summary' + summaryKey] = summaryValue;
							})
						}

						if (dashboard.defaults == undefined) {dashboard.defaults = {}}

						_.each(data, function (value, key)
						{
							if (_.isNotSet(data[key]) && _.isSet(dashboard.defaults[key]))
							{
								data[key] = dashboard.defaults[key]
							}
						});
						
						data = _.assign(dashboard.defaults, data);
					}

					app.set(
					{
						scope: 'util-dashboard',
						context: dashboard.name,
						name: 'data',
						value: data
					});

                    if (dashboard.formatController != undefined)
					{
                        app.invoke(dashboard.formatController, param, data)
                    }

					if (dashboard.renderController != undefined)
					{
						app.invoke(dashboard.renderController, param, data)
					}
					else if (dashboard.chart)
					{
						app.invoke('util-view-dashboard-chart-render', param, data)
					}
					else
					{
						if (!dashboard.multiple)
						{
							if (dashboard.containerSelector == undefined)
							{
								dashboard.containerSelector = '#' + dashboard.name
							}

							if (dashboard.template == undefined)
							{
								dashboard.template = '{{count}}'
							}
							
							app.refresh(
							{
								selector: dashboard.containerSelector,
								template: dashboard.template,
								data: data
							});

							if (dashboard.styles != undefined)
							{
								var styleClass;
								var styleDo;

								var _styleClass;
								var _styleDo;

								_.each(dashboard.styles, function (style)
								{
									style.valid = false;

									if (_.isFunction(style.when))
									{
										style.valid = style.when(data);
									}

									if (style.valid && style.class != undefined)
									{
										styleClass = style.class;
										_styleClass = style;
									}

									if (style.valid && style.do != undefined)
									{
										styleDo = style.do;
										_styleDo = style;
									}
								});

								if (styleClass != undefined)
								{
									$(dashboard.containerSelector).addClass(styleClass)
								}

								if (styleDo != undefined)
								{
									if (_.isFunction(styleDo))
									{
										styleDo(_styleDo, data);
									}
									else
									{
										mydigitalstructure._util.controller.invoke(styleDo, _styleDo, data)
									}
								}
							}
						}
					}
				}
			}
		},
		{
			name: 'util-view-dashboard-chart-render',
			code: function (param, rows)
			{	
				var dashboard = app._util.param.get(param, 'dashboard', {default: {}}).value;
				var chartOptions = app._util.param.get(dashboard, 'options', {default: {}}).value;
				var containerSelector = app._util.param.get(dashboard, 'containerSelector').value;
				var name = app._util.param.get(dashboard, 'name').value;
				var noDataText = app._util.param.get(dashboard, 'noDataText', {default: '<div class="text-muted">No data.</div>'}).value;
				var chartData = app._util.param.get(dashboard, 'chartData').value;
				var fields = app._util.param.get(dashboard, 'fields', {default: {}}).value;
				
				if (containerSelector == undefined && name != undefined)
				{
					containerSelector = '#' + name
				}

				if (containerSelector != undefined)
				{
					var chartType = app._util.param.get(chartOptions, 'options', {default: 'Bar', remove: true}).value;

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
						else
						{
							if (chartData.labels != undefined) {setLabels = false}
							if (chartData.series != undefined) {setSeries = false}
						}

						var labelsField = fields.labels;
						if (labelsField == undefined)
						{
							labelsField = _.first(_.keys(_.first(rows)));
						}

						var dataField = fields.data;
						if (dataField == undefined)
						{
							dataField = _.last(_.keys(_.first(rows)));
						}

						_.each(rows, function (row)
						{
							if (setLabels)
							{
								chartData.labels.push(row[labelsField])
							};

							if (setSeries)
							{
								chartData.series[0].data.push(row[dataField])
							};
						});

						if (app._util.controller.exists('util-view-chart-render'))
						{
							app.invoke('util-view-chart-render',
							{
								containerSelector: containerSelector,
								type: chartType,
								options: chartOptions,
								data: chartData,
								_dashboard: dashboard
							});
						}
						else
						{
							if (_.isObject(Chartist))
							{
								new Chartist[chartType](containerSelector, chartData, chartOptions);
							}
						}
					}
				}
			}
		}
	]);
}






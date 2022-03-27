/*
	{
    	title: "Util; Charting",
    	Using chartist; https://github.com/gionkunz/chartist-js

    	Works with Util Dashboard & Search

    	eg: options:
		{
			height: 300,
			type: 'Bar',
			seriesBarDistance: 20,
			reverseData: false,
			horizontalBars: true,
			axisY:
			{
				offset: 100
			},
			axisX:
			{
				onlyInteger: true
			}
		}
  	}

*/

entityos._util.factory.chart = function (param)
{	
	app.add(
	{
		name: 'util-view-chart-show',
		code: function (param, rawData)
		{	
			//var search = app._util.param.get(param, 'search', {default: {}}).value;
			var setLegend = app._util.param.get(param, 'legend', {default: false}).value;
			var legendText = app._util.param.get(param, 'legendText', {default: ''}).value;
			var reverseLegend = app._util.param.get(param, 'reverseLegend', {default: false}).value;
			var reverseLegendView = app._util.param.get(param, 'reverseLegendView', {default: false}).value;
			var foreignObjects = app._util.param.get(param, 'foreignObjects').value;

			if (rawData == undefined) {rawData = []}

			var chartOptions = app._util.param.get(param, 'chartOptions').value;

			if (chartOptions == undefined)
			{
				chartOptions = app._util.param.get(param, 'options').value;
			}

			var containerSelector = app._util.param.get(param, 'containerSelector').value;
			//var name = app._util.param.get(search, 'name').value;

			var noDataText = app._util.param.get(param, 'noDataText', {default: '<div class="text-muted">No data.</div>'}).value;

			var chartData = app._util.param.get(param, 'chartData').value;

			/*if (chartData == undefined && _.has(search, 'chart.data'))
			{
				chartData = search.chart.data;
			}*/

			//var fields = app._util.param.get(search.chart, 'fields', {default: {}}).value;
			
			/*if (containerSelector == undefined && name != undefined)
			{
				containerSelector = '#' + name
			}*/

			var chartContainerSelector = app._util.param.get(param, 'chartContainerSelector').value;
			var legendContainerSelector = app._util.param.get(param, 'legendContainerSelector').value;
			var showAsPercentage = app._util.param.get(param, 'showAsPercentage').value;
			var showAsPercentageValue = app._util.param.get(param, 'showAsPercentageValue').value;

			if (setLegend == undefined)
			{
				setLegend = (legendContainerSelector != undefined)
			}
	
			if (chartContainerSelector == undefined)
			{
				chartContainerSelector = containerSelector;

				if ((setLegend || legendText != ''))
				{
					chartContainerSelector = chartContainerSelector + '-chart';
				}
			}

			if ((setLegend || legendText != '') && legendContainerSelector == undefined)
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

				//if (rawData.length == 0)
				//{
					//app.show(containerSelector, noDataText);
				//}
				//else
				//{
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

					/*var labelsField = fields.labels;
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
					});*/

					if (setLegend)
					{
						var legendView = [];

						var seriesLabels = [];

						_.each(chartData.labels, function (label)
						{
							seriesLabels.push(label)
						});

						if (chartType == 'Bar' || chartType == 'Line')
						{
							seriesLabels = [];

							_.each(chartData.series, function (series)
							{
								if (series.caption != undefined)
								{
									seriesLabels.push(series.caption);
								}
								else
								{
									seriesLabels.push(series.name);
								}
							})
							//seriesLabels = _.map(chartData.series, 'name');
						}

						if (seriesLabels.length != 0)
						{
							legendView.push('<ul class="ct-legend">');

							var legendViewItems = [];

							if (reverseLegend)
							{
								seriesLabels = _.reverse(seriesLabels)
							}

							_.each(seriesLabels, function (seriesLabel, sL)
							{
								legendViewItems.push('<li class="ct-series-' + (sL + 1) + '" data-legend="' + (sL + 1) + '">' + seriesLabel + '</li>');
							});

							if (reverseLegendView)
							{
								legendViewItems = _.reverse(legendViewItems)
							}

							legendView = _.concat(legendView, legendViewItems);

							legendView.push('</ul>');

							if (legendContainerSelector == undefined)
							{
								legendContainerSelector = search.containerSelector + '-legend'
							}

							app.show(legendContainerSelector, legendView.join(''));
						}
					}

					if (legendText != '')
					{
						app.show(legendContainerSelector, legendText);
					}

					if (showAsPercentage)
					{
						var sum = _.sum(chartData.series);

						chartOptions.labelInterpolationFnc = function(value, index)
						{
							return Math.round(chartData.series[index] / sum * 100) + '%';
						}
					}

					if (showAsPercentageValue)
					{
						var sum = _.sum(chartData.series);

						chartOptions.labelInterpolationFnc = function(value, index)
						{
							return Math.round(chartData.series[index] / sum * 100) + '% (' + chartData.series[index] + ')'
						}
					}

					app.invoke('util-view-chart-render',
					{
						containerSelector: chartContainerSelector,
						type: chartType,
						options: chartOptions,
						data: chartData,
						clear: true,
						foreignObjects: foreignObjects,
						_param: param
					});
					
				//}
			}
		}
	});

	app.add(
	{
		name: 'util-view-chart-render',
		code: function (param)
		{
			var type = app._util.param.get(param, 'type', {default: 'Bar'}).value;
			var data = app._util.param.get(param, 'data').value;
			var options = app._util.param.get(param, 'options').value;
			var viewOptions = app._util.param.get(param, 'viewOptions').value;
			var containerSelector = app._util.param.get(param, 'containerSelector').value;
			var clear = app._util.param.get(param, 'clear').value;
			var foreignObjects = app._util.param.get(param, 'foreignObjects', {default: false}).value

			if (containerSelector != undefined)
			{
				if (clear)
				{
					$(containerSelector).html('');
				}

				if (_.isObject(Chartist))
				{
					var chartistChart = new Chartist[type](containerSelector, data, options, viewOptions);
					chartistChart.supportsForeignObject = foreignObjects;
				}
			}
		}
	});
}




/*
 
 headers: [{text:}]
 captions: [{text:, source:}]
 fileData: [{name: value}]
  
*/

entityos._util.factory.export = function (param)
{
	app.controller['util-export-table'] = function (param, response)
	{
		var context = entityos._util.param.get(param, 'context').value;
		var container = entityos._util.param.get(param, 'container').value;
		var filename = entityos._util.param.get(param, 'filename').value;
		var filenamePrefix = entityos._util.param.get(param, 'filenamePrefix').value;
		var scope = entityos._util.param.get(param, 'scope').value;

		if (context == undefined) {context = container}
		if (scope == undefined && context != undefined) {scope = '_table-' + context}

		if (scope != undefined)
		{
			var tableParam = entityos._util.data.get(
			{
				scope: scope,
				context: '_param'
			});

			if (tableParam == undefined)
			{
				entityos._util.notify({message: 'There is no data to export.', type: 'danger'})
			}
			else
			{
				entityos._util.data.clear(
				{
					scope: scope,
					context: 'export',
					name: 'cancelProcessing'
				});

				if (tableParam.format != undefined)
				{
					var captions = $.grep(tableParam.format.columns, function (column)
					{
						return ((column.param != undefined || column.name != undefined) && (column.caption != undefined || column.exportCaption != undefined) && (column.export == undefined || column.export == true))
					});

					$.each(captions, function(c, caption)
					{
						caption.text = caption.caption;
						if (caption.exportCaption != undefined)
						{
							caption.text = caption.exportCaption;
						}

						if (caption.exportName != undefined)
						{
							caption.source = caption.exportName
						}
						else
						{
							caption.source = caption.param;
							if (caption.source == undefined) {caption.source = caption.name}
						}
					});

					entityos._util.data.set(
					{
						scope: scope,
						context: 'export',
						name: 'captions',
						value: captions
					});

					if (tableParam.format.row != undefined)
					{
						if (_.isFunction(tableParam.format.row.method))
						{
							entityos._util.data.set(
							{
								scope: scope,
								context: 'export',
								name: 'exportController',
								value: tableParam.format.row.method,
								valueAsIs: true
							});
						}

						if (!_.isUndefined(tableParam.format.row.controller))
						{
							entityos._util.data.set(
							{
								scope: scope,
								context: 'export',
								name: 'exportController',
								value: tableParam.format.row.controller
							});
						}
					}

					if (tableParam.format != undefined)
					{
						var methodColumns = $.grep(tableParam.format.columns, function (column)
						{
							return (column.method != undefined || column.controller != undefined)
						});

						entityos._util.data.set(
						{
							scope: scope,
							context: 'export',
							name: 'exportControllerColumns',
							value: methodColumns
						});
					}

					if (filename == undefined && filenamePrefix == undefined)
					{
						filename = 'export-' + scope.replace('_table-', '') + '.csv'
					}

					entityos._util.data.set(
					{
						scope: scope,
						context: 'export',
						name: 'filename',
						value: filename
					});

                    if (_.has(tableParam, 'options.exportGetMore'))
                    {
                        entityos._util.data.set(
                        {
                            scope: scope,
                            context: 'export',
                            name: 'getMore',
                            value: tableParam.options.exportGetMore
                        });
                    }

					app.controller['util-export-download'](
					_.assign(
					{
						source: scope,
						filename: filename
					},
					param))
				}	
			}
		}
	}

	app.controller['util-export-download'] = function (param, response)
	{
		var source = entityos._util.param.get(param, 'source').value;
		var scope = entityos._util.param.get(param, 'scope').value;
		if (source == undefined) {source = scope}

		var filename = entityos._util.param.get(param, 'filename').value;
		var beforeExportController = entityos._util.param.get(param, 'beforeExportController').value;

		$('.entityos-export[data-context="' + source + '"]').addClass('disabled');
		$('.entityos-export[data-context="' + source + '"]').text('Downloading...');
		$('.myds-export[data-context="' + source + '"]').addClass('disabled');
		$('.myds-export[data-context="' + source + '"]').text('Downloading...');

		if (param == undefined) {param = {}}

		var exportParam = entityos._util.data.get(
		{
			controller: source,
			context: 'export'
		});

		var dataSource = entityos._util.data.get(
		{
			controller: source
		});

		if (_.isObject(response))
		{	
			var exportController = exportParam.exportController;
			var exportControllerColumns = exportParam.exportControllerColumns;
			var rows = response.data.rows;

			if (exportController != undefined)
			{
				if (!_.isFunction(exportController))
				{
					if (_.isFunction(app.controller[exportController]))
					{
						exportController = app.controller[exportController];
					}
				}	
				
				if (_.isFunction(exportController))
				{
					_.each(rows, function (row)
					{
						exportController(row)
					});
				}	
			}

			if (exportControllerColumns.length != 0)
			{
				_.each(rows, function (row)
				{
					_.each(exportControllerColumns, function (column)
					{
						if (column.name == undefined) {column.name = column.param}

						if (column.name != undefined)
						{
							if (typeof(column.method) == 'function')
							{
								row[column.name] = column.method(row)
							}

							if (typeof app.controller[column.controller] == 'function')
							{
								columnData = entityos._util.controller.invoke({name: column.controller}, column, row);
								if (columnData != undefined) {row[column.name] = columnData}
							}
						}
					});
				});
			}

			app.data[source].all = _.concat(app.data[source].all, rows);
		}	

		var getMore = false;

        if (exportParam.getMore == undefined || exportParam.getMore == true)
        {
            if (!_.isUndefined(dataSource.count))
            {
                if (_.gt(dataSource.count, _.size(dataSource['all'])))
                {
                    getMore = true;
                }
            }
        }

		var cancel = (exportParam.cancelProcessing == true);

		if (cancel)
		{
			app.invoke(exportParam.processing.cancelledController,
			{
				source: source
			});
		}
		else
		{
			if (getMore)
			{
				var _retrieve = entityos._scope.data[source]._retrieve;

				var retrievedRows = _.toNumber(_.size(dataSource['all']));
				var totalRows = _.toNumber(dataSource.count);
				var rowsToRetrieve = totalRows - retrievedRows;
				var rows;

				if (_.has(exportParam.processing, 'rows'))
				{
					rows = _.toNumber(exportParam.processing.rows)
				}

				if (rows == undefined)
				{
					rows = 1000;
				}

				if (rowsToRetrieve > rows)
				{
					rowsToRetrieve = rows;
				}
			
				if (_.has(exportParam.processing, 'controller'))
				{
					app.invoke(exportParam.processing.controller,
					{
						source: source,
						percentage: parseInt((retrievedRows / totalRows) * 100)
					})
				} 

				entityos._util.view.moreSearch(
				{
					id: _retrieve.moreid,
					startrow: _.size(dataSource['all']),
					rows: rowsToRetrieve,
					controller: 'util-export-download',
					controllerParam: param
				})
			}
			else
			{
				if (_.has(exportParam.processing, 'controller'))
				{
					app.invoke(exportParam.processing.controller,
					{
						source: source,
						percentage: 100
					})
				} 

				param.fileData = app.data[source]['all'];

				if (beforeExportController != undefined)
				{
					var _fileData = entityos._util.controller.invoke(beforeExportController, param);
					if (_fileData != undefined)
					{
						param.fileData = _fileData
					}
				}

                if (_.includes(filename, '.json'))
                {
                    app.controller['util-export-data-to-json'](param);
                }
                else
                {
                    app.controller['util-export-data-to-csv'](param);
                }
			}	
		}
	}

	app.controller['util-export-data-to-csv'] = function (param, data)
	{
		var source = entityos._util.param.get(param, 'source').value;
		
		var exportParam = entityos._util.data.get(
		{
			controller: source,
			context: 'export'
		});

		var fileData = entityos._util.param.get(param, 'fileData').value;

		if (_.isUndefined(fileData))
		{
			fileData = entityos._util.data.get(
			{
				controller: 'util-export-0',
				context: 'filedata'
			});
		}	

		var csv = [];

		if (exportParam.headers != undefined)
		{	
			$.each(exportParam.headers, function (h, header)
			{
				csv.push('"' + header.text + '"');
				csv.push('\r\n');
			});

			csv.push('\r\n');
		}

		if (exportParam.captions != undefined)
		{
			csv.push(_.map(exportParam.captions, function (caption)
			{
				caption._text = entityos._util.decode(caption.text);
				caption._text = _.replaceAll(caption._text, '"', '""');
				return '"' + caption._text + '"'
			}).join(','));

			csv.push('\r\n');
		}
		
		if (fileData == undefined)
		{
			fileData = exportParam.fileData;	
		}

		if (param.filename == undefined)
		{
			param.filename = exportParam.filename;	
		}
		
		var sources;

		if (_.size(_.filter(exportParam.captions, function (c) {return c.source != undefined})) != 0)
		{
			sources = _.pluck(exportParam.captions, 'source');
		}

		if (fileData != undefined)
		{
			var rowData;
			var findParam;
			var findValue;

			$.each(fileData, function (r, row)
			{
				rowData = [];

				//if there is one column with source, then all have to have source!
				if (sources != undefined)
				{
					_.each(sources, function (source)
					{
						if (_.isObject(source))
						{
							findParam = source.find;
							if(_.isObject(findParam))
							{
								findParam.id = row[findParam.context];
								if (_.isUndefined(findParam.name)) {findParam.name = 'title'};
								findValue = entityos._util.data.find(findParam);
								findValue = _.toString(findValue);
								findValue = $('<p>' + he.decode(findValue) + '</p>').text();
								rowData.push('"' + (findValue==undefined?'':_.replaceAll(findValue,'"','\'')) + '"');
							}
							else
							{
								rowData.push('');
							}
						}
						else
						{
							findValue = $('<p>' + he.decode(_.toString(row[source])) + '</p>').text();

							var contents = $('<p>' + he.decode(_.toString(row[source])) + '</p>').contents();

							contents = _.filter(contents, function (content)
							{
								return (!_.isUndefined(content.data) && content.data != '\n')
							});

							findValue = _.join(_.map(contents, function (content)
							{
								var r;
								if (_.trim(content.data) != '') {r = content.data}		
								return r
							}), '; ')

							rowData.push('"' + (row[source]==undefined?'':_.replaceAll(findValue,'"','\'')) + '"');
						}	
					})
				}
				else
				{	
					for (var key in row)
			  		{
			     		if (row.hasOwnProperty(key))
			     		{
			     			rowData.push('"' + he.decode(row[key]) + '"');
			     		}  
			     	}
			    } 	

		     	csv.push(rowData.join(','));
		     	csv.push('\r\n');
			});
		}	

		if (param == undefined) {param = {}}
		param.data = csv.join('');
		app.controller['util-export-to-file'](param)
	}

	app.controller['util-export-data-to-json'] = function (param, data)
	{
		var source = entityos._util.param.get(param, 'source').value;
		
		var exportParam = entityos._util.data.get(
		{
			controller: source,
			context: 'export'
		});

		var fileData = entityos._util.param.get(param, 'fileData').value;

		if (_.isUndefined(fileData))
		{
			fileData = entityos._util.data.get(
			{
				controller: 'util-export-0',
				context: 'filedata'
			});
		}

        if (fileData == undefined)
		{
			fileData = exportParam.fileData;	
		}

		if (param.filename == undefined)
		{
			param.filename = exportParam.filename;	
		}

		var json = [];
        var jsonItemTemplate = {};
		
		if (exportParam.captions != undefined)
		{
            _.each(exportParam.captions, function (caption)
            {
                if (_.isSet(caption.field))
                {
                    jsonItemTemplate[caption.text.toLowerCase()] = caption.field
                }
                else
                {
                    jsonItemTemplate[caption.text.toLowerCase()] = caption.name 
                }
            });

            _.each(fileData, function (_fileData)
            {
                _jsonItemTemplate = _.cloneDeep(jsonItemTemplate);
                _.each(_jsonItemTemplate, function (value, key)
                {
                    _jsonItemTemplate[key] = _fileData[value]
                });
				json.push(_jsonItemTemplate);
            });
		}
		
		if (param == undefined) {param = {}}
		param.data = JSON.stringify(json, null, 4);
		app.controller['util-export-to-file'](param);
	}

    entityos._util.controller.add(
    {
        name: 'util-export-data-as-is-to-csv',
        code: function (param, data)
        {
            var scope = entityos._util.param.get(param, 'scope').value;
            var context = entityos._util.param.get(param, 'context').value;
            var fileData = entityos._util.param.get(param, 'fileData').value;

            if (_.isUndefined(fileData) && !_.isUndefined(scope))
            {
                fileData = entityos._util.data.get(
                {
                    scope: scope,
                    context: context
                });
            }	

            var csv = [];
        
            if (param.filename == undefined)
            {
                param.filenamePrefix = 'export';	
            }
            
            if (fileData != undefined)
            {
                var rowData;
                var findParam;
                var findValue;

                var row = _.first(fileData);
                var headerData = [];

                for (var key in row)
                {
                    if (row.hasOwnProperty(key))
                    {
                        headerData.push('"' + key + '"'); 
                    }  
                }

                csv.push(headerData.join(','));
                csv.push('\r\n');

                $.each(fileData, function (r, row)
                {
                    rowData = [];
                    
                    for (var key in row)
                    {
                        if (row.hasOwnProperty(key))
                        {
                            rowData.push('"' + he.decode(_.toString(row[key])) + '"');
                        }  
                    }
                    
                    csv.push(rowData.join(','));
                    csv.push('\r\n');
                });
            }	

            if (param == undefined) {param = {}}
            param.data = csv.join('');
            app.controller['util-export-to-file'](param)
        }
    });

	app.controller['util-export-to-file'] = function (param)
	{
		var fileData = entityos._util.param.get(param, 'data').value;
		var filename = entityos._util.param.get(param, 'filename').value;
		var filenamePrefix = entityos._util.param.get(param, 'filenamePrefix').value;
		var controller = entityos._util.param.get(param, 'controller').value;
		var source = entityos._util.param.get(param, 'source').value;
		var object = entityos._util.param.get(param, 'object').value;
		var objectContext = entityos._util.param.get(param, 'objectContext').value;
		var download = entityos._util.param.get(param, 'download', {default: false}).value;
		var useLocal = entityos._util.param.get(param, 'useLocal').value;

		if (_.isUndefined(filenamePrefix))
		{	
			filenamePrefix = entityos._util.data.get(
			{
				controller: 'util-export',
				context: 'dataContext',
				name: 'filenamePrefix'
			});
		}	

		if (_.isUndefined(filename))
		{
			if (_.isUndefined(filenamePrefix))
			{
				filenamePrefix = (controller?controller:source);
				if (_.isUndefined(filenamePrefix)) {filenamePrefix = 'export'}
			}
			filename = filenamePrefix + '-' + _.toUpper(moment().format("DDMMMYYYY")) + '.csv';
		}

		if (useLocal == undefined)
		{
			useLocal = entityos.saveAs;
		}
	
		if (useLocal && window.saveAs != undefined)
		{
			var blob = new Blob([fileData], {type: "text/plain;charset=utf-8"});
			saveAs(blob, filename);

			$('#util-export').modal('hide');

			entityos._util.doCallBack(param);
		}
		else
		{
			var data =
			{
				filedata: fileData,
				filename: filename,
				object: object,
				objectcontext: objectContext
			}

			$.ajax(
			{
				type: 'POST',
				url: '/rpc/core/?method=CORE_FILE_MANAGE',
				data: data,
				dataType: 'json',
				success: function(response)
				{
					if (download)
					{
						window.open(response.link, '_self');
					}

					$('#util-export').modal('hide');

					entityos._util.doCallBack(param, response);
				}
			});
		}	
	}

	app.controller['util-export-image'] = function (param)
	{
		if (param.viewStatus == 'shown')
		{
			var dataContext = entityos._util.data.get(
			{
				controller: 'util-export-image',
				context: 'dataContext'
			});

			var param =
			{
				elementSVGContainerID: dataContext.source,
				elementImageContainerID: 'util-export-image-view',
				elementImageDownloadID: 'util-export-image-download',
				viewScale: 4,
				format: 'png',
				styles: '<style type="text/css"><![CDATA[' +
							'svg{font:10px arial; -webkit-tap-highlight-color:transparent; shape-rendering: crispEdges;} line, path{fill:none;stroke:#000} text{-webkit-user-select:none;-moz-user-select:none;user-select:none}.c3-bars path,.c3-event-rect,.c3-legend-item-tile,.c3-xgrid-focus,-ygrid{shape-rendering:crispEdges}-chart-arc path{stroke:#fff}-chart-arc text{fill:#fff;font-size:13px}-grid line{stroke:#aaa;}-grid text{fill:#aaa} .c3-xgrid, .c3-ygrid{stroke-dasharray:3 3}-text-empty{fill:gray;font-size:2em}-line{stroke-width:1px}-circle._expanded_{stroke-width:1px;stroke:#fff}-selected-circle{fill:#fff;stroke-width:2px}-bar{stroke-width:0}-bar._expanded_{fill-opacity:.75}-target-focused{opacity:1}-target-focused path-line,-target-focused path-step{stroke-width:2px}-target-defocused{opacity:.3!important}-region{fill:#4682b4;fill-opacity:.1}-brush .extent{fill-opacity:.1}-legend-item{font-size:12px}-legend-item-hidden{opacity:.15}-legend-background{opacity:.75;fill:#fff;stroke:#d3d3d3;stroke-width:1}-title{font:14px sans-serif}-tooltip-container{z-index:10}-tooltip{border-collapse:collapse;border-spacing:0;background-color:#fff;empty-cells:show;-webkit-box-shadow:7px 7px 12px -9px #777;-moz-box-shadow:7px 7px 12px -9px #777;box-shadow:7px 7px 12px -9px #777;opacity:.9}-tooltip tr{border:1px solid #CCC}-tooltip th{background-color:#aaa;font-size:14px;padding:2px 5px;text-align:left;color:#FFF}-tooltip td{font-size:13px;padding:3px 6px;background-color:#fff;border-left:1px dotted #999}-tooltip td>span{display:inline-block;width:10px;height:10px;margin-right:6px}-tooltip td.value{text-align:right}-area{stroke-width:0;opacity:.2}-chart-arcs-title{dominant-baseline:middle;font-size:1.3em}-chart-arcs -chart-arcs-background{fill:#e0e0e0;stroke:none}-chart-arcs -chart-arcs-gauge-unit{fill:#000;font-size:16px}-chart-arcs -chart-arcs-gauge-max,-chart-arcs -chart-arcs-gauge-min{fill:#777}-chart-arc -gauge-value{fill:#000}' +
							']]></style>',
				onComplete: entityos._util.downloadImage	
			}
			
			entityos._util.svgAsImage(param);
		}	
	}

	entityos._util.controller.add(
	{
		name: 'util-export-sheet',
		code: function (param)
		{
			var dataContext = entityos._util.param.get(param, 'dataContext').value;

			if (dataContext != undefined)
			{
				param = _.assign(param, param.dataContext)
			}

			entityos._util.export.sheet.init(param);
		}
	})
}

if (entityos._util.export = {})
{
	entityos._util.export = {}
}

//https://github.com/sheetjs/sheetjs

if (_.isObject(window.XLSX))
{
	entityos._util.export.sheet =
	{
		data: {},

		init: function (param)
		{
			entityos._util.import.sheet.data._param = param;

			var controller = entityos._util.param.get(param, 'controller').value;
			var scope = entityos._util.param.get(param, 'scope').value;
			var context = entityos._util.param.get(param, 'context').value;
			var name = entityos._util.param.get(param, 'name',  {default: 'export-format'}).value;
			var filename = entityos._util.param.get(param, 'filename', {default: 'export.xlsx'}).value;
			
			var exportData = entityos._util.param.get(param, 'data').value;
			var templateAttachment = entityos._util.param.get(param, 'templateAttachment').value;

			var download = entityos._util.param.get(param, 'download', {default: false}).value;
			var store = entityos._util.param.get(param, 'store', {default: false}).value;

			entityos._util.param.set(param, 'exportData', exportData);

			var url = entityos._util.param.get(param, 'url').value; 
			if (url == undefined)
			{
				if (templateAttachment != undefined)
				{
					
					url = '/rpc/core/?method=CORE_ATTACHMENT_DOWNLOAD&id=' + templateAttachment;
				}
			}

			var exportFormats = entityos._util.param.get(param, 'formats').value; 

			if (exportFormats == undefined) 
			{
				if (scope != undefined)
				{
					exportFormats = entityos._util.data.get(
					{
						scope: scope,
						context: context,
						name: name
					});
				}
			}

			if (url == undefined)
			{
				entityos._util.log.add(
				{
					message: 'entityos._util.export.sheet; no template URL'
				});
			}
			else
			{
				/* Convert to $.ajax with beforeSend: to set responseType */
				var req = new XMLHttpRequest();
				req.open("GET", url, true);
				req.responseType = "arraybuffer";

				req.onload = function(e)
				{
					var data = new Uint8Array(req.response);
				  	var workbook = XLSX.read(data, {type: "array", cellStyles: true, bookImages: true});

					if (workbook.Workbook != undefined)
				  	{
						var worksheet;

					  	entityos._util.export.sheet.data.names = workbook.Workbook.Names;

						//CHECK IF NEED TO INSERT ANY CELLS BASED ON RANGES AND THEN ADJUST NAMES IN THE WORK BOOK.

						_.each(exportFormats, function (format)
						{
							if (format.range != undefined)
							{
								_.each(entityos._util.export.sheet.data.names,  function (name)
								{
									name.sheet = _.replaceAll(_.first(_.split(name.Ref, '!')), "'", '');
						 			name.cell = _.replaceAll(_.last(_.split(name.Ref, '!')), '\\$', '');
									name.row = numeral(name.cell).value();
									name.col = _.replace(name.cell, name.row, '');

									if (format.range.header != undefined)
									{
										if (format.range.header.name != undefined)
										{
											if (format.range.header.name.toLowerCase() == name.Name.toLowerCase())
											{
												format.range.header.cell = name.cell;
											}
										}

										if (format.range.header.firstRow)
										{
											format.range.header.cell =
												(format.range.header.firstRowColumn!=undefined?format.range.header.firstRowColumn:'A') + '1';
										}
									}

									if (format.range.footer != undefined)
									{
										if (format.range.footer.name != undefined)
										{
											if (format.range.footer.name.toLowerCase() == name.Name.toLowerCase())
											{
												format.range.footer.cell = name.cell;
											}
										}

										if (format.range.footer.lastRow)
										{
											format.range.footer.cell = (format.range.footer.lastRowColumn!=undefined?format.range.footer.lastRowColumn:'A') +
													(numeral(entityos._util.import.sheet.data.sheets[format.sheet].maximumRow).value() + 1);
										}
									}
								});

								var headerRow = numeral(format.range.header.cell).value(); //45
								var footerRow = numeral(format.range.footer.cell).value(); //53
				   
								format.fieldsStartRow = headerRow + 1; //46
								format.fieldsEndRow = footerRow - 1; //52
				   		   
								var rows = _.range(format.fieldsStartRow, format.fieldsEndRow + 1);
								
								var data = _.find(exportData, function(_exportData)
								{
									return (_exportData.object == format.storage.object 
												&& _exportData.field == format.storage.field)
								});

                                worksheet = workbook.Sheets[format.sheet];
                                
                                //Split into seperate validations
                                _.each(worksheet['!validations'], function (validation)
                                {
                                    if (!_.isPlainObject(validation.ref))
                                    {
                                        var _ref = _.split(validation.ref, ' ');
                                        if (_ref.length > 1)
                                        {
                                            var _validations = [];

                                            _.each(_ref, function (ref, r)
                                            {
                                                if (r==0)
                                                {
                                                    validation.ref = ref;
                                                }
                                                else
                                                {
                                                    var _validation = _.cloneDeep(validation);
                                                    _validation.ref = ref;
                                                    _validations.push(_validation);
                                                }
                                            });

                                            worksheet['!validations'] = _.concat(worksheet['!validations'], _validations);
                                        }
                                    }
                                });
							   
							   if (data != undefined)
							   {
									format.rowsToAdd = (data.value.length - rows.length + 1);
                                    if (format.rowsToAdd < 0) {format.rowsToAdd = 0}

									if (format.rowsToAdd > 0)
									{
										worksheet = workbook.Sheets[format.sheet];

										XLSX_OPS.insert_rows(worksheet, format.fieldsEndRow, format.rowsToAdd);

										format.rowsImpactedAfter = format.fieldsEndRow;

										_.each(entityos._util.export.sheet.data.names,  function (name)
										{
											if ((name.row > format.rowsImpactedAfter) && (name.sheet == format.sheet))
											{
												name.row = name.row + format.rowsToAdd;
												name.cell = name.col + name.row;
												name.Ref = '\'' + name.sheet + '\'!$' + name.col + '$' + name.row;
											}
										});

										var newRows = _.range(format.fieldsEndRow + 1, (format.fieldsEndRow + format.rowsToAdd + 1));
										
                                        var minCol = 99999;
                                        var maxCol = 0;

										_.each(format.range.fields, function (field)
										{
											field._cellRC = XLSX.utils.decode_cell(field.column + format.fieldsEndRow);

                                            if (field._cellRC.c < minCol) {minCol = field._cellRC.c}
                                            if (field._cellRC.c > maxCol) {maxCol = field._cellRC.c}

											field.merge = _.find(worksheet['!merges'], function (merge)
											{
												return (merge.s.c == field._cellRC.c) && (merge.s.r == field._cellRC.r);
											});

                                            if (field.merge != undefined)
                                            {
                                                if (field.merge.e.c > maxCol) {maxCol = field.merge.e.c}
                                            }
										});

										_.each(newRows, function (newRow)
										{
                                            var fieldColumns = _.range(minCol, (maxCol + 1));

											_.each(fieldColumns, function (column)
											{
                                                var newCell = XLSX.utils.encode_cell({r: (newRow - 1), c: column});
                                                var cloneCell = XLSX.utils.encode_cell({r: (format.fieldsEndRow - 1), c: column});

                                                worksheet[newCell] = _.cloneDeep(worksheet[cloneCell]);
												//worksheet[column + newRow] = _.cloneDeep(worksheet[column + format.fieldsEndRow]);
											});

											_.each(format.range.fields, function (field)
											{
												if (field.merge != undefined)
												{
													var newMerge = _.cloneDeep(field.merge);
													newMerge.s.r = (newRow - 1);
													newMerge.e.r = (newRow - 1);
													worksheet['!merges'].push(newMerge);
												}
											});

                                            worksheet['!rows'][(newRow - 1)] = worksheet['!rows'][(format.fieldsEndRow - 1)];
										});

                                        _.each(worksheet['!validations'], function (validation)
                                        {
                                            if (!_.isPlainObject(validation.ref))
                                            {
                                                validation.ref = XLSX.utils.decode_range(validation.ref);
                                            }

                                            if (validation.ref.e.r > format.rowsImpactedAfter)
                                            {
                                                validation.ref.e.r = validation.ref.e.r + format.rowsToAdd;
                                            }

                                            if (validation.ref.s.r > format.rowsImpactedAfter)
                                            {        
                                                validation.ref.s.r = validation.ref.s.r + format.rowsToAdd;
                                            }
                                        });
									}
							   }
							}
						});

						//RESOLVE NAMES TO CELLS

					  	_.each(entityos._util.export.sheet.data.names,  function (name)
					  	{
					  		name.sheet = _.replaceAll(_.first(_.split(name.Ref, '!')), "'", '');
							name.cell = _.replaceAll(_.last(_.split(name.Ref, '!')), '\\$', '');

					  		_.each(exportFormats, function (format)
							{
								if (format.name != undefined)
								{
									if (format.name.toLowerCase() == name.Name.toLowerCase() 
											&& format.sheet == name.sheet)
									{
			   							format.cell = name.cell;
									}
								}

								if (format.range != undefined)
								{
									if (format.range.header != undefined)
									{
										if (format.range.header.name != undefined)
										{
											if (format.range.header.name.toLowerCase() == name.Name.toLowerCase())
											{
												format.range.header.cell = name.cell;
											}
										}

										if (format.range.header.firstRow)
										{
											format.range.header.cell =
												(format.range.header.firstRowColumn!=undefined?format.range.header.firstRowColumn:'A') + '1';
										}
									}

									if (format.range.footer != undefined)
									{
										if (format.range.footer.name != undefined)
										{
											if (format.range.footer.name.toLowerCase() == name.Name.toLowerCase())
											{
												format.range.footer.cell = name.cell;
											}
										}

										if (format.range.footer.lastRow)
										{
											format.range.footer.cell = (format.range.footer.lastRowColumn!=undefined?format.range.footer.lastRowColumn:'A') +
													(numeral(entityos._util.import.sheet.data.sheets[format.sheet].maximumRow).value() + 1);
										}
									}
								}
							});
					  	});
					}

				  	// GO THROUGH FORMATS AND WRITE VALUES TO WORKSHEETS

				  	var cell;
				  	var value;

				  	_.each(exportFormats, function (format)
				  	{
				  		if (format.sheet != undefined)
				  		{
							worksheet = workbook.Sheets[format.sheet];

					  		value = format.value;

							if (format.range != undefined)
							{
								entityos._util.export.sheet.range(format, workbook, worksheet, exportData);
							}	
							else
							{  
								if (format.storage != undefined)
								{
									var storageData = _.find(exportData, function (data)
									{
										return data.field == format.storage.field;
									});

									if (storageData != undefined)
									{
										if (storageData.value != undefined)
										{
											value = _.unescape(_.unescape(storageData.value))
										}
									}
								}

								if (worksheet != undefined)
								{
									cell = worksheet[format.cell];

									if (cell == undefined)
									{
										cell = {};
									}

									cell.t = 's';

									if (format.type != undefined)
									{
										cell.t = format.type;
									}
								
									cell.v = (value!=undefined?value:'');
								}
							}
						}
					});

				  	entityos._util.export.sheet.data.workbook = workbook;

				  	//https://github.com/sheetjs/sheetjs#writing-options
			
					if (store)
					{
						entityos._util.export.sheet.data.base64 = XLSX.write(workbook, {type: 'base64', cellStyles: true, bookImages: true});
						entityos._util.export.sheet.data.binary = XLSX.write(workbook, {type: 'array', cellStyles: true, bookImages: true});
						entityos._util.export.sheet.store.save(param,
						{
							base64: entityos._util.export.sheet.data.base64,
							binary: entityos._util.export.sheet.data.binary
						})
					}
					else
					{
						param = entityos._util.param.set(param, 'data', entityos._util.export.sheet.data)
						entityos._util.onComplete(param);
					}
					
					if (download)
					{
						XLSX.writeFile(workbook, filename, {cellStyles: true, bookImages: true}
					);}
					
					//If email: true then process the automation task by name - once moved to myds util
				}

				req.send();
			}
		},
		
		range: function (format, workbook, worksheet, exportData)
 		{
 			//Use range header to get cells to work through
 			//Assume cells have been resolved

 			var headerCell = format.range.header.cell; // A45
 			var headerRow = numeral(format.range.header.cell).value(); //45

 			var footerCell = format.range.footer.cell; // A53
 			var footerRow = numeral(format.range.footer.cell).value(); //53

 			var fieldsStartRow = headerRow + 1; //46
 			var fieldsEndRow = footerRow - 1; //52

 			var fields = format.range.fields;

 			var importData = []

 			var rows = _.range(fieldsStartRow, fieldsEndRow + 1);
 			
 			if (format.name == undefined)
 			{
 				format.name = _.camelCase(format.caption).toLowerCase();
 			}

 			var data = _.find(exportData, function(_exportData)
			{
				return (_exportData.object == format.storage.object 
							&& _exportData.field == format.storage.field)
			})
			
			if (data != undefined)
			{
				_.each(rows, function (row, r)
				{
					rowFields = _.cloneDeep(fields);
					rowData = data.value[r];

                    if (rowData != undefined)
                    {
                        _.each(rowFields, function (field)
                        {
                            field.suffix = (r + 1);
                            field.row = row;
                            field.cell = field.column + field.row;  

                            field._cell = worksheet[field.cell];
                            field._processing = {name: format.name + '-' + field.name + '-' + field.suffix, validate: {}, notes: {}}

                            if (field._cell != undefined)
                            {
                                var value = rowData[field.name]

                                if (value != undefined)
                                {
                                    field._cell.t = 's';

                                    if (format.type != undefined)
                                    {
                                        field._cell.t = format.type;
                                    }

                                    if (_.has(field, 'format.values'))
                                    {
                                        if (field.format.values[value] != undefined)
                                        {
                                            value = field.format.values[value]
                                        }
                                    }
                                
                                    field._cell.v = (value!=undefined?value:'');
                                }

                                if (_.has(field, 'defaults.hasValue.style'))
                                {
                                     _.assign(field._cell.s, field.defaults.hasValue.style)   
                                }
                            }
                        });
                    }
				});
			}
 		},

		store:
		{
			save: function (param, fileData)
			{
				var filename = entityos._util.param.get(param, 'filename', {default: 'export.xlsx'}).value;
				var object = entityos._util.param.get(param, 'object').value;
				var objectContext = entityos._util.param.get(param, 'objectContext').value;
				var base64 = entityos._util.param.get(param, 'base64', {default: false}).value;
				var type = entityos._util.param.get(param, 'type').value;

				if (base64)
				{
					entityos.cloud.invoke(
					{
						method: 'core_attachment_from_base64',
						data:
						{
							base64: fileData.base64,
							filename: filename,
							object: object,
							objectcontext: objectContext
						},
						callback: entityos._util.export.sheet.store.process,
						callbackParam: param
					});
				}
				else
				{
					var blob = new Blob([fileData.binary], {type: 'application/octet-stream'});

					var formData = new FormData();
					formData.append('file0', blob);
					formData.append('filename0', filename);
					formData.append('object', object);
					formData.append('objectcontext', objectContext);
					if (!_.isUndefined(type))
					{
						formData.append('type0', type);
					}

					$.ajax('/rpc/attach/?method=ATTACH_FILE',
					{
						method: 'POST',
						data: formData,
						processData: false,
						contentType: false,
						success: function(data)
						{
							entityos._util.export.sheet.store.process(param, data)
						},
						error: function(data)
						{
							app.notify(data)
						}
					});
				}
			},

			process: function (param, response)
			{
				var controller = entityos._util.param.get(param, 'controller').value;
				var compress = entityos._util.param.get(param, 'compress', {default: false}).value;

				if (response.status == 'OK')
				{
					var attachment;

					if (_.has(response, 'data.rows'))
					{
						attachment = _.first(response.data.rows);
					}
					else
					{
						attachment = response;
					}

					entityos._util.export.sheet.data.attachment =
					{
						id: attachment.attachment,
						link: attachment.attachmentlink,
						href: '/download/' + attachment.attachmentlink
					}
				}

				param = entityos._util.param.set(param, 'data', entityos._util.export.sheet.data);

				if (compress)
				{
					entityos._util.export.sheet.store.compress(param)
				}
				else
				{
					entityos._util.export.sheet.store.complete(param)
				}
			},
		
			compress: function (param, response)
			{
				var filename = entityos._util.param.get(param, 'filename', {default: 'export.xlsx'}).value;
				var object = entityos._util.param.get(param, 'object').value;
				var objectContext = entityos._util.param.get(param, 'objectContext').value;

				var _filename = _.split(filename, '.');
				_filename.pop()

				filename = _.join(_filename, '.') + '-' + moment().format('DDMMMYYYY-HHmm') + '.zip';

				if (response == undefined)
				{
					entityos.cloud.invoke(
					{
						method: 'core_attachment_zip',
						data:
						{
							object: object,
							objectcontext: objectContext,
							filename: filename
						},
						callback: entityos._util.export.sheet.store.compress,
						callbackParam: param
					});
				}
				else
				{
					if (response.status == 'OK')
					{
						entityos._util.export.sheet.data.attachment =
						{
							id: response.attachment,
							link: response.attachmentlink,
							href: '/download/' + response.attachmentlink
						}

						param = entityos._util.param.set(param, 'data', entityos._util.export.sheet.data);
					}

					entityos._util.export.sheet.store.complete(param)
				}
			},

			complete: function (param)
			{
				app.invoke('util-view-spinner-remove', {controller: 'util-export-create-sheet'});	
				entityos._util.onComplete(param);
			}
		}
	}
}


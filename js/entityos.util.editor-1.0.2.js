//Uses tinyMCE
// https://cdnjs.cloudflare.com/ajax/libs/tinymce/5.0.0/tinymce.min.js
// or https://cdn.tiny.cloud/1/no-api-key/tinymce/5/tinymce.min.js" referrerpolicy="origin"

entityos._util.factory.editor = function (param)
{
	app.add(
	{
		name: 'util-view-editor',
		code: function (param)
		{
			var height = entityos._util.param.get(param, 'height', {"default": '370px'}).value;
			var width = entityos._util.param.get(param, 'width', {"default": 'auto'}).value;
			var dynamicTags = entityos._util.param.get(param, 'dynamicTags', {"default": false}).value;
			var theme = entityos._util.param.get(param, 'theme', {"default": 'modern'}).value;
			var selector = entityos._util.param.get(param, 'selector', {"default": 'textarea'}).value;
			var object = entityos._util.param.get(param, 'object', {"default": '32'}).value;
			var toolbars = entityos._util.param.get(param, 'toolbars').value;
			var simple = entityos._util.param.get(param, 'simple', {"default": false}).value;
			var settings = entityos._util.param.get(param, 'settings').value;
			var onInit = entityos._util.param.get(param, 'onInit').value;
			var onSetup = entityos._util.param.get(param, 'onSetup').value;
			var contentCSS = entityos._util.param.get(param, 'contentCSS').value;
			var content = entityos._util.param.get(param, 'content').value;
			var additional = '';
			var cleanContent = entityos._util.param.get(param, 'cleanContent', {default: true}).value;
			var fonts = entityos._util.param.get(param, 'fonts').value;

			var fontFormats = 'Andale Mono=andale mono,times;Arial=arial,helvetica,sans-serif;Arial Black=arial black,avant garde;' +
									'Book Antiqua=book antiqua,palatino;Comic Sans MS=comic sans ms,sans-serif;Courier New=courier new,courier;' +
									'Georgia=georgia,palatino;Helvetica=helvetica;Impact=impact,chicago;Symbol=symbol;Tahoma=tahoma,' +
									'arial,helvetica,sans-serif;Terminal=terminal,monaco;Times New Roman=times new roman,times;' +
									'Trebuchet MS=trebuchet ms,geneva;Verdana=verdana,geneva;Webdings=webdings;Wingdings=wingdings,zapf dingbats'

			if (!_.isUndefined(fonts)) {fontFormats = fontFormats + fonts}

			if (cleanContent) {content = _.unescape(content)}
			if (dynamicTags) {additional = 'dynamicTags,'}

			if (settings == undefined)
			{	
				settings = 
				{
					selector: selector,
					theme: "silver",
					skin: 'oxide',
					height : height, 
					width : width,
					plugins:
					[
							"advlist autolink link image lists charmap print preview anchor",
							"searchreplace visualblocks code fullscreen insertdatetime media",
							"table paste"
					],

					menubar: false,
					statusbar : false,
					toolbar_items_size: 'small',

					style_formats:
					[
							{title: 'Bold text', inline: 'b'}
					],

					font_formats: fonts,

					templates: '/ondemand/core/?method=CORE_DYNAMIC_TAG_SEARCH',
					link_list: '/rpc/core/?method=CORE_EDITOR_LINK_SEARCH',
					image_list: '/rpc/core/?method=CORE_EDITOR_IMAGE_SEARCH',

					browser_spellcheck: true,
					content_css: contentCSS,
					convert_urls: false
				}

				if (simple)
				{
					settings.toolbar1 = 'bold italic underline | alignleft aligncenter alignright alignjustify | fontselect fontsizeselect';
					settings.toolbar2 = 'forecolor backcolor | cut copy paste | bullist numlist | outdent indent blockquote | undo redo | link unlink anchor code';
				}	
				else
				{	
					if (toolbars == undefined)
					{
						settings.toolbar1 = 'bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | forecolor backcolor | bullist numlist | formatselect fontselect fontsizeselect';
						settings.toolbar2 = 'cut copy paste | outdent indent blockquote | undo redo | link unlink anchor image media code';
						settings.toolbar3 = 'table | hr removeformat | subscript superscript | charmap emoticons | ltr rtl | visualchars visualblocks nonbreaking pagebreak | template | fullscreen';
					}
					else
					{
						_.each(toolbars, function (toolbar, t)
						{
							settings['toolbar' + (t+1)] = toolbar;
						});
					}
				}

				if (onInit != undefined)
				{
					settings.init_instance_callback = onInit;
				}

				settings.setup = app.controller['util-view-editor-setup'];

				if (onSetup != undefined)
				{
					settings._setup = onSetup;
				}
				
				if (content != undefined)
				{
					settings.init_instance_callback = function (editor)
					{
						editor.setContent(content)
					}
				}
			}
				
			tinyMCE.remove(selector)
			tinyMCE.init(settings);						
		}
	});

	app.add(
	{
		name: 'util-view-editor-setup',
		code: function (editor)
		{
			var fontSize = '12pt';
			var fontFamily = 'Helvetica';

			if (_.has(entityos.options, 'editor.fontSize'))
			{
				fontSize = entityos.options.editor.fontSize;
			}

			if (_.has(entityos.options, 'editor.fontFamily'))
			{
				fontFamily = entityos.options.editor.fontFamily;
			}

			editor.on('init', function() 
			{
				this.getDoc().body.style.fontSize = fontSize;
				this.getDoc().body.style.fontFamily = fontFamily;		
			});

			editor.on('PreInit', function(e)
			{
				var doc = this.getDoc();

				if (_.has(entityos.options, 'editor.setup'))
				{
					var jscript = entityos.options.editor.setup;
					var script = doc.createElement("script");
					script.type = "text/javascript";
					script.entityosendChild(doc.createTextNode(jscript));
					doc.getElementsByTagName('head')[0].entityosendChild(script);
				}    
		   });

		   var data = $('#' + editor.id).data();
		   var dataScope = data.scope;
		   if (_.isEmpty(dataScope)) {dataScope = data.controller}

		   if (!_.isEmpty(dataScope))
		   {
		   		editor.on('change', function(e)
				{
			      entityos._util.data.set(
					{
						controller: dataScope,
						context: data.context,
						value: editor.getContent()
					});
			  	});

				editor.on('keyup', function(e)
				{
			      entityos._util.data.set(
					{
						controller: dataScope,
						context: data.context,
						value: editor.getContent()
					});
			  	});
		   }

			if (_.isFunction(editor.settings._setup)) {editor.settings._setup(editor)}
		}
	});

	app.add(
	{
		name: 'util-editor',
		code: function (param)
		{
			entityos._util.controller.invoke('util-view-editor', param)
		}
	});

	app.add(
	{
		name: 'util-editor-get-tags',
		code: function(param)
		{
			var object = app._util.param.get(param, 'object').value;
			var container = app._util.param.get(param, 'container').value;
			var editor = app._util.param.get(param, 'editor').value;
			var tags = app.get({scope: 'util-format-tags'});

			if (_.isUndefined(tags))
			{
				app.invoke('util-format-tags');
				tags = app.get({scope: 'util-format-tags'});
			}

			var objectTags = _.filter(tags, function(tag) {return tag.object == object || _.isUndefined(tag.object)});

			if (!_.isUndefined(container))
			{
				app.vq.init(container, {working: true});
				_.each(objectTags, function(tag)
				{
					app.vq.add(
					[
					  '<div class="row">' +
					  	'<div class="col-sm-12 formatTags mb-1"' +
					  	  //' data-controller="util-editor-insert-tag"' +
					  	  ' id="util-editor-tag-' + _.replaceAll(tag.caption, ' ', '-') + '"' +
					  	  ' style="cursor: pointer;"' +
					  	  ' data-caption="{{' + tag.caption + '}}">' + tag.caption + 
					  	'</div>' +
					  '</div>'
					]);
				});

				app.vq.render(container);

				$('.formatTags').hover(function()
				{
					mceBookmark = tinyMCE.get(editor).selection.getBookmark({type: 1, normalized: true});
				})
				.click(function()
				{
					app.invoke('util-editor-insert-tag',
					{
						elementID: $(this).attr('id'),
						editorID: editor,
						mceBookmark: mceBookmark
					});
				});
			}
		}
	});

	app.add(
	{
		name: 'util-editor-insert-tag',
		code: function(param)
		{
			var elementID = param.elementID;
			var editor = tinyMCE.get(param.editorID);
			var mceBookmark = param.mceBookmark;
			var insertText = $('#' + elementID).attr('data-caption');

			if (!_.isUndefined(mceBookmark))
			{
				tinyMCE.get(param.editorID).selection.moveToBookmark(mceBookmark);
			}
			editor.execCommand('mceInsertContent', false, insertText);
		}
	});

	app.add(
	{
		name: 'util-format-render',
		code: function(param)
		{
			var object = app._util.param.get(param, 'object').value;
			var templateXHTML = app._util.param.get(param, 'templateXHTML', {'default': ''}).value;
			var objectData = app._util.param.get(param, 'objectData', {'default': {}}).value;
			var objectOtherData = app._util.param.get(param, 'objectOtherData').value;
			var returnFormat = app._util.param.get(param, 'returnFormat', {'default': 'html'}).value;
			var controllers = [];

			templateXHTML = (templateXHTML).replace(/\[\[/g,'<span class="template">');
			templateXHTML = (templateXHTML).replace(/\]\]/g,'</span>');
			templateXHTML = (templateXHTML).replace(/\{\{/g,'<span class="template">');
			templateXHTML = (templateXHTML).replace(/\}\}/g,'</span>');

			var xhtml;

			$('#entityos-app-template-preview').html(templateXHTML);
			xhtml = $('#entityos-app-template-preview');

			$('span.template', xhtml).each(function(i,e) 
			{
				var templateTag = _.filter(app.get({scope: 'util-format-tags', valueDefault: []}), 
									function (a) { return a.caption == $(e).html() && a.object == object; }).shift();

				if (!_.isUndefined(templateTag))
				{
					$(e).html('');
					$(e).attr('data-format-tag', templateTag.caption);
					$(e).attr('data-format-source', templateTag.source);

					if (templateTag.controller)
					{
						$(e).attr('data-format-controller', templateTag.controller);
						if (templateTag.controllerParam)
						{
							var controllerParam = ($.type(templateTag.controllerParam) == 'object') 
													? JSON.stringify(templateTag.controllerParam)
													: (templateTag.controllerParam).toString();
							$(e).attr('data-format-controller-param', controllerParam);
						}
					}
					else
					{
						if (templateTag.sourceGroup)
						{
							$(e).attr('data-format-source-group', templateTag.sourceGroup);
						}
						else
						{
							var aSource = (templateTag.source).split('.');
							$(e).attr('data-format-source-group', aSource[0]);
						}
					}	

					if (templateTag.object == object && templateTag.type == 1)
					{
						var sSource = templateTag.source;
						var controllerName = $(e).attr('data-format-controller');

						if (controllerName != undefined)
						{
							if (typeof app.controller[controllerName] == 'function')
							{
								var controllerParam = $(e).attr('data-format-controller-param');
								if (!_.isUndefined(controllerParam))
								{
									controllerParam = (_.startsWith(controllerParam, '{')) ? JSON.parse(controllerParam) : controllerParam;
								}
								$(e).html(app.invoke(controllerName, objectData, controllerParam));
							}	
						}

						else if (objectData[sSource] != undefined)
						{	
							$(e).html(app.invoke('convert-to-br', _.toString(objectData[sSource])));
						}
						else
						{
							var aSource = (sSource).split('.');
							sSource = aSource[aSource.length-1];

							if (objectData[sSource])
							{	
								$(e).html(app.invoke('convert-to-br', _.toString(objectData[sSource])));
							}
						}	
					}

					if (templateTag.object == object && templateTag.type == 2)
					{
						if ($.grep(controllers, function (a) { return a.method == templateTag.method; }).length == 0)
						{
							controllers.push({method: templateTag.method, group: aSource[0]});
						}	
					}
				}			
			});

			//TYPE = 2 - subtables - need to gather up
			var html = $(xhtml).html();
			// We don't want html tags in the return text - replace them here 
			if (returnFormat == 'text')
			{
				$('span.template', xhtml).each(function(i,e) 
				{
					html = html.replace(e.outerHTML, $(e).html()).formatXHTML();
				});
			}

			if (controllers.length != 0)
			{	
				_.each(controllers, function(controller) 
				{
					if (objectOtherData == undefined)
					{
						entityos.cloud.search(
						{
							object: controller.method,
							data:
							{
								criteria: 
								{
									fields: [{name: '*'}],
									filters: 
									[
										{name: 'object', comparison: 'EQUAL_TO', value: object},
										{name: 'objectcontext', comparison: 'EQUAL_TO', value: objectContext}
									],
									sorts: [{name: 'id', direction: 'desc'}],
									options: {rows: 1000}
								}
							},
							callback: 'util-format-process',
							callbackParam: {group: controller.group}
						});
					}
					else
					{
						param.group = this.group;
						param.xhtml = html;
						html = app.invoke('util-format-process', param, objectOtherData)
					}
				});
			}	

			return html;
		}
	});

	app.add(
	{
		name: 'util-format-process',
		code: function(param, response)
		{
			var maxRows = app.get({scope: 'util-setup', context: 'templateMaxFirstPageRows'});
			maxRows = maxRows || app._util.param.get(param, 'maxRows', {'default': 10}).value;

			var xhtml = document;

			if (!_.isUndefined(param.xhtml))
			{
				$('#entityos-app-template-preview').html(param.xhtml);
				xhtml = $('#entityos-app-template-preview');
			}

			if (response.status != 'ER')
			{
				var aTR = [];
				var sTRID = 'template-' + param.group;

				$('[data-format-source-group="' + param.group + '"]', oXHTML).each(function(i) 
				{
					$('[data-format-source-group="' + param.group + '"]:first', oXHTML).closest('tr').clone()

					var oTR = $(this).closest('tr');
					var sTRXHTML = $(oTR).html();
					$(oTR).addClass(sTRID);

					$(sTRXHTML).each(function()
					{
						$(this).find('span.template').each(function(i,e) 
						{
							$(e).html($(e).attr('data-format-source'));
						});

						aTR.push($(this).html());
					});
				});	

				sTRXHTML = aTR.join('');

				$(oResponse).each(function(r)
				{	
					var oRow = this;

					var oTRClone = $('[data-format-source-group="' + param.group + '"]:first', oXHTML).closest('tr').clone();

					oTRClone.find('[data-format-source]').each(function()
					{
						var sSource = $(this).attr('data-format-source');
						var controllerName = $(this).attr('data-format-controller');

						if (controllerName != undefined)
						{
							if (typeof app.controller[controllerName] == 'function')
							{
								var controllerParam = $(e).attr('data-format-controller-param');
								if (!_.isUndefined(controllerParam))
								{
									controllerParam = (_.startsWith(controllerParam, '{')) ? JSON.parse(controllerParam) : controllerParam;
								}
								$(this).html(app.invoke(controllerName, oRow, controllerParam));
							}
						}	
						else if (oRow[sSource])
						{	
							$(this).html(app.invoke('convert-to-br', oRow[sSource]));
						}
						else
						{
							var aSource = (sSource).split('.');
							sSource = aSource[aSource.length-1];

							if (oRow[sSource])
							{	
								$(this).html(app.invoke('convert-to-br', oRow[sSource]));
							}
						}	
					})

					$('[data-format-source-group="' + param.group + '"]:first', oXHTML).closest('tr').parent().after(oTRClone);
						
				});

				$('[data-format-source-group="' + param.group + '"]:first', oXHTML).closest('tr').remove();

				//Split if greater than maxRows.

				if (maxRows != undefined)
				{	
					var aAllRows =  $('tr', oXHTML);

					if (aAllRows.length > maxRows + 1)
					{
						var table = $('[data-format-source-group="' + param.group + '"]:first', oXHTML).closest('table');
						var tableContainer = table.children().remove();
						var tableHeader = table.children().first('tr');

						var aPagedRows = [];
						var sHTML = ''

						while(aAllRows.length)
						{
							aPagedRows.push(aAllRows.splice(0, maxRows));
						}

						$.each(aPagedRows, function (r, rows)
						{	
							rows.unshift('<div style="page-break-before:always;"></div>' + tableContainer.replace('</table>', ''))
							rows.push('</table>');
							sHTML = sHTML & rows.join('');
						});

						oXHTML.html(sHTML)
					}
				}

				if (!_.isUndefined(param.xhtml))
				{return oXHTML.html()};
			}
		}
	});
};
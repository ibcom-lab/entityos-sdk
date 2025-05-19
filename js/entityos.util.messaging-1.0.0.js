/*
	{
    	title: "Util; Messaging",
  	}

  	https://docs.entityos.cloud/endpoint_messaging
*/

entityos._util.factory.messaging = function (param)
{
	app.add(
	[
        {
			name: 'util-messaging-conversation-account-show',
			code: function (param, response)
			{
				var viewSelector = app._util.param.get(param, 'viewSelector', { default: '#util-messaging-conversation-account-view' }).value;
				var accountEnabledText = app._util.param.get(param, 'accountEnabledText', { default: 'You can join conversations.' }).value;
				var accountEnableText = app._util.param.get(param, 'accountEnableText', { default: 'This will allow you to join conversations.' }).value;
				var userID = app._util.param.get(param, 'user', { default: app.whoami().thisInstanceOfMe.user.id }).value;
				var title = app._util.param.get(param, 'title', { default: app.whoami().thisInstanceOfMe.user.guid }).value;

				if (response == undefined)
				{
					entityos.cloud.search(
					{
						object: 'setup_messaging_account',
						fields:
						[
							'guid', 'accountname', 'title'
						],
						filters:
						[
							{
								field: 'type',
								value: 4
							},
							{
								field: 'user',
								value: userID
							}
						],
						callback: 'util-messaging-conversation-account-show',
						callbackParam: param
					});
				}
				else
				{
					if (_.get(param, 'onComplete') != undefined)
					{
						app.invoke('util-on-complete', param);
					}
					else
					{
						var accountView = app.vq.init({ queue: 'util-messaging-conversation-account' });

						if (response.data.rows.length == 0)
						{
							accountView.add(
							[
								'<div class="mt-3"><button type="button" class="btn btn-default btn-sm btn-outline w-75 myds-click" data-spinner="prepend" ',
									' data-controller="util-messaging-conversation-account-create"',
									' data-title="', title, '"',
									' data-user="', userID, '"',
									' data-account-enable-text="', accountEnableText, '"',
									' data-account-enabled-text="', accountEnabledText, '"',
								'>',
								'Enable Messaging',
								'</button></div>',
								'<div class="text-secondary my-3">', accountEnableText, '</div>'
							]);
						}
						else
						{
							accountView.add(
							[
								'<div class="mt-3 text-success font-weight-bold"><i class="far fa-check-circle"></i> Enabled</div>',
								'<div class="text-secondary my-3">', accountEnabledText, '</div>',
							]);
						}

						accountView.render(viewSelector);
					}
				}
			}
		},
       	{
			name: 'util-messaging-conversation-account-create',
			code: function (param, response)
			{
				var userID = app._util.param.get(param.dataContext, 'user', { default: app.whoami().thisInstanceOfMe.user.id }).value;
				var title = app._util.param.get(param.dataContext, 'title', { default: app.whoami().thisInstanceOfMe.user.guid }).value;
				var accountEnabledText = app._util.param.get(param.dataContext, 'accountEnabledText', { default: 'You can join conversations.' }).value;
				var accountEnableText = app._util.param.get(param.dataContext, 'accountEnableText', { default: 'This will allow you to join conversations.' }).value;

				if (response == undefined)
				{
					var data =
					{
						type: 4,
						user: userID,
						title: title,
						accountname: title 
					}

					entityos.cloud.save(
					{
						object: 'setup_messaging_account',
						data: data,
						callback: 'util-messaging-conversation-account-create',
						callbackParam: param
					});
				}
				else
				{
					if (_.get(param, 'onComplete') != undefined)
					{
						app.invoke('util-on-complete', param);
					}
					else
					{
						app.invoke('util-messaging-conversation-account-show',
						{
							user: userID,
							title: title,
							accountEnabledText: accountEnabledText,
							accountEnableText: accountEnableText
						});
					}
				}
			}
		}
    ]);
}
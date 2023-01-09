/*
    Utility for protecting data through encryption and storing locally.

    Uses: https://github.com/brix/crypto-js

    Data stored locally can also be protected using a key stored on entityos.cloud.

    ie to pre-encrypt data before saving on entityos.cloud:

    1. Create a key [localDataProtectionKey]
    2. Save key [localDataProtectionKey] in local browser cache, but before saving it:
        2a. Create another key [cloudLocalKeyProtectionKey] that is saved on entityos.cloud against the user account.
        2b. Use the cloudKey to encrypt the local key
    3. Use the local [localDataProtectionKey] key to encrypt data

    Also; you can use object "core_protect_ciphertext" to create hashes of data as signatures etc

    More @ https://docs.entityos.cloud/protect_cryptography
*/

entityos._util.protect =
{
	data: {},

	available: function (param)
    {
        return ('CryptoJS' in window);
    },

	key: 
    {
        data: {},
        create:
        {				
            single:	function(param)
            {
                var type;
                var persist = entityos._util.param.get(param, 'persist', {default: false}).value;
                var cryptoKeyReference = entityos._util.param.get(param, 'cryptoKeyReference').value;
                var local = entityos._util.param.get(param, 'local', {default: false}).value;
                var keySize = entityos._util.param.get(param, 'local', {default: 512/32}).value;
                var savedCryptoKey = entityos._util.param.get(param, 'savedCryptoKey').value;

                if (!savedCryptoKey)
                {	
                    var salt = CryptoJS.lib.WordArray.random(128/8);
                    var password = entityos._scope.session.logonKey;
                    if (password == undefined) {password = (Math.random()).toString()}
                    var cryptoKey = CryptoJS.PBKDF2(password, salt, { keySize: keySize }).toString();

                    param = entityos._util.param.set(param, 'cryptoKey', cryptoKey);

                    if (persist)
                    {	
                        if (local)
                        {	
                            entityos._util.whenCan.invoke(
                            {
                                now:
                                {
                                    method: entityos._util.local.cache.save,
                                    param:
                                    {
                                        key: cryptoKeyReference,
                                        cryptoKeyReference: cryptoKeyReference,
                                        persist: true,
                                        protect: param.protect,
                                        data: cryptoKey
                                    }
                                },
                                then:
                                {
                                    comment: 'util.local.cache.save<>util.protect.key.create.single',
                                    method: entityos._util.protect.key.create.single,
                                    set: 'savedCryptoKey',
                                    param: param
                                }	
                            });
                        }
                        else
                        {
                            var data = 
                            {
                                reference: cryptoKeyReference,
                                key: cryptoKey
                            }

                            param.savedCryptoKey = cryptoKey;

                            entityos.cloud.save(
                            {
                                object: 'core_protect_key',
                                data: data,
                                callback: entityos._util.protect.key.create.single,
                                callbackParam: param
                            });	
                        }
                    }
                    else
                    {
                        param = entityos._util.param.set(param, 'savedCryptoKey', cryptoKey);
                        entityos._util.protect.key.create.single(param);
                    }
                }
                else
                {	
                    var cryptoKey = entityos._util.param.get(param, 'cryptoKey', {remove: true}).value;

                    if (cryptoKeyReference != undefined && savedCryptoKey != undefined)
                    {	
                        entityos._util.protect.key.data[cryptoKeyReference] = savedCryptoKey;
                    }

                    return entityos._util.whenCan.complete(savedCryptoKey, param)
                }	
            }		
        },			

        search: function(param)
        {
            var local = entityos._util.param.get(param, 'local', {default: false}).value;
            var cryptoKeyReference = entityos._util.param.get(param, 'cryptoKeyReference').value;
            var createKey = entityos._util.param.get(param, 'createKey', {default: false}).value;
            var cryptoKey = entityos._util.protect.key.data[cryptoKeyReference];

            if (cryptoKey != undefined)
            {	
                entityos._util.whenCan.complete(cryptoKey, param);
            }
            else
            {	
                var protectCryptoKey = entityos._util.param.get(param, 'protectCryptoKey').value;

                if (protectCryptoKey === undefined)
                {
                    if (local)
                    {
                        param = entityos._util.param.set(param, 'key', cryptoKeyReference);
                        
                        entityos._util.whenCan.execute(
                        {
                            now:
                            {
                                method: entityos._util.local.cache.search,
                                param: param
                            },
                            then:
                            {
                                comment: 'util.local.cache.search<>util.protect.key.search',
                                method: entityos._util.protect.key.search,
                                set: 'protectCryptoKey',
                                param: param
                            }
                        });
                    }	
                    else
                    {
                        entityos.cloud.search(
                        {
                            object: 'core_protect_key',
                            fields: ['key'],
                            filters: 
                            [
                                {
                                    field: 'reference',
                                    value: 'cryptoKeyReference'
                                }
                            ],
                            sorts:
                            [
                                {
                                    field: 'modifieddate',
                                    direction: 'desc'
                                }
                            ],
                            includeMetadata: true,
                            includeMetadataGUID: true,
                            callbackParam: param,
                            callback: function (param, response)
                            {
                                param = entityos._util.param.set(param, 'protectCryptoKey', '');

                                if (response.data.rows.length !== 0)
                                {	
                                    param.protectCryptoKey = _.first(response.data.row).key;
                                }

                                entityos._util.protect.key.search(param)
                            }
                        });
                    }	
                }
                else
                {
                    if (createKey)
                    {	
                        entityos._util.whenCan.execute(
                        {
                            now:
                            {
                                method: entityos._util.protect.key.create.single,
                                param:
                                {
                                    local: local,
                                    persist: true,
                                    cryptoKeyReference: cryptoKeyReference
                                }
                            },
                            then:
                            {
                                comment: 'util.protect.key.create.single<>util.protect.key.search',
                                method: entityos._util.protect.key.search,
                                param: param
                            }
                        });
                    }

                    if (protectCryptoKey != undefined)
                    {	
                        entityos._util.protect.key.data[cryptoKeyReference] = protectCryptoKey;
                    }

                    return entityos._util.whenCan.complete(protectCryptoKey, param);
                }
            }	
        }					
    },

    encrypt: function(param)
    {
        var cryptoKey = entityos._util.param.get(param, 'cryptoKey', {remove: true}).value;
        var cryptoInitialiseKey = entityos._util.param.get(param, 'cryptoInitialiseKey', {remove: true}).value;
        var cryptoKeyReference = entityos._util.param.get(param, 'cryptoKeyReference').value;
        var cryptoOutput = entityos._util.param.get(param, 'cryptoOutput', {default: 'Hex'}).value;
        var cryptoKeyFormat = entityos._util.param.get(param, 'cryptoKeyFormat', {default: 'Hex'}).value;

        if (cryptoKey == undefined && cryptoKeyReference != undefined)
        {
            cryptoKey = entityos._util.protect.key.data[cryptoKeyReference];
        }

        if (cryptoKey != undefined)
        {
            var data = entityos._util.param.get(param, 'data', {remove: true}).value;

            if (_.isPlainObject(data))
            {
                data = JSON.stringify(data);
                data = _.escape(data);
            }

            var _cryptoKey = CryptoJS.enc[cryptoKeyFormat].parse(cryptoKey);
            var options = {};

            if (cryptoInitialiseKey != undefined)
            {
                options.iv = CryptoJS.enc[cryptoKeyFormat].parse(cryptoInitialiseKey);    
            }

            var protectedData = CryptoJS.AES.encrypt(data, _cryptoKey, options).toString(CryptoJS.format[cryptoOutput]);

            if (entityos._util.param.get(param, 'onComplete').exists)
            {	
                param = entityos._util.param.set(param, 'protectedData', protectedData);
                entityos._util.onComplete(param)
            }
            else
            {
                return entityos._util.whenCan.complete(protectedData, param);
            }	
        }
        else
        {	
            entityos._util.whenCan.invoke(
            {
                now:
                {
                    method: entityos._util.protect.key.search,
                    param: param
                },
                then:
                {
                    comment: 'util.protect.key.search<>util.protect.encrypt',
                    method: entityos._util.protect.encrypt,
                    set: 'cryptoKey',
                    param: param
                }	
            });
        }	
    },

    decrypt: function(param)
    {
        var cryptoKey = entityos._util.param.get(param, 'cryptoKey', {remove: true}).value;
        var cryptoInitialiseKey = entityos._util.param.get(param, 'cryptoInitialiseKey', {remove: true}).value;
        var cryptoKeyReference = entityos._util.param.get(param, 'cryptoKeyReference').value;
        var cryptoInput = entityos._util.param.get(param, 'cryptoInput', {default: 'Hex'}).value;
        var cryptoKeyFormat = entityos._util.param.get(param, 'cryptoKeyFormat', {default: 'Hex'}).value;

        if (cryptoKey == undefined && cryptoKeyReference != undefined)
        {
            cryptoKey = entityos._util.protect.key.data[cryptoKeyReference];
        }

        if (cryptoKey != undefined)
        {
            var _cryptoKey = CryptoJS.enc[cryptoKeyFormat].parse(cryptoKey);

            var options = {};

            if (cryptoInitialiseKey != undefined)
            {
                options.iv = CryptoJS.enc[cryptoKeyFormat].parse(cryptoInitialiseKey);    
            }

            var protectedData = entityos._util.param.get(param, 'protectedData', {remove: true}).value;

            var _protectedData = CryptoJS.enc[cryptoInput].parse(protectedData);

            var data = CryptoJS.AES.decrypt({ciphertext:_protectedData}, _cryptoKey, options).toString(CryptoJS.enc.Utf8);

            if (entityos._util.param.get(param, 'onComplete').exists)
            {	
                param = entityos._util.param.set(param, 'data', data)
                entityos._util.onComplete(param)
            }
            else
            {
                return entityos._util.whenCan.complete(data, param);
            }	
        }
        else
        {	
            entityos._util.whenCan.invoke(
            {
                now:
                {
                    method: entityos._util.protect.key.search,
                    param: param
                },
                then:
                {
                    comment: 'util.protect.key.search<>util.protect.decrypt',
                    method: entityos._util.protect.decrypt,
                    set: 'cryptoKey',
                    param: param
                }	
            });
        }	
    },
    
    hash: function (param)
    {
        if (_.isString(param))
        {
            param = {data: param}
        }

        var data = entityos._util.param.get(param, 'data', {remove: true, default: ''}).value;
        var hashType = entityos._util.param.get(param, 'hashType').value;
        var hashOutput = entityos._util.param.get(param, 'hashOutput', {default: 'hex'}).value;
        var hashFunction;

        if (hashType == undefined)
        {
            if (_.has(window, 'CryptoJS.SHA256'))
            {
                hashType = 'SHA256';
                hashFunction = window.CryptoJS.SHA256;
            }
            else if (_.isFunction(window.hex_md5))
            {
                hashType = 'MD5';
                hashFunction = hex_md5;
            }
        }

        if (hashType != undefined)
        {
            if (hashFunction == undefined)
            {
                if (_.has(window, 'CryptoJS'))
                {
                    hashFunction = CryptoJS[hashType];
                }
            }
        }

        var _return = {hashType: hashType, data: data};

        if (_.isFunction(hashFunction))
        {
            if (_.includes(hashType, 'SHA'))
            {
                _return.dataHashed = hashFunction(data).toString(CryptoJS.enc[hashOutput]);
            }
            else
            {
                _return.dataHashed = hashFunction(data);
            }
        }

        return _return;
    }
}

entityos._util.protect.oauth =
{
	connect: 
    {
        data: {},
        enable: function(param, response)
        {			
            if (response == undefined)
            {
                entityos.cloud.save(
                {
                    object: 'setup_external_user_access',
                    data:
                    {
                        type: 2,
                        authenticationlevelminimum: 1,
                        targetuser: entityos._util.whoami().thisInstanceOfMe.user.id,
                        userguid: '9c069925-e6b0-4a94-910b-a2b336b1867a'
                    },
                    callback: entityos._util.protect.oauth.connect.enable,
                    callbackParam: param
                });
            }
            else
            {
				console.log(response);
                entityos._util.onComplete(param, response)
            }
        },
        init: function(param, response)
        {			
             var objectContext = entityos._util.param.get(param, 'objectContext').value;

             if (objectContext == undefined)
             {
                console.log('!! ER: Missing objectContext');

                entityos._util.sendToView(
                {
                    from: 'entityos-protect-oauth-init',
                    status: 'error',
                    message: 'Missing objectContext',
                    data: _.clone(param)
                });
             }
             else
             {
                if (response == undefined)
                {
                    entityos.cloud.search(
                    {
                        object: 'setup_external_user_access',
                        fields: ['guid', 'etag', 'createddate', 'notes'],
                        filters: {userlogon: 'connect@ibcom'},
                        callback: entityos._util.protect.oauth.connect.init,
                        callbackParam: param
                    });
                }
                else
                {
                    if (response.status == 'ER')
                    {
                        console.log('!!! ER: ' + response.error.errornotes)
                    }
                    else
                    {
                        if (response.data.rows.length == 0)
                        {
                            console.log('!! ER: No Access Enabled - Use entityos._util.protect.oauth.connect.enable');

                            entityos._util.sendToView(
                            {
                                from: 'entityos-protect-oauth-init',
                                status: 'error',
                                message: 'No Access Enabled - Use entityos._util.protect.oauth.connect.enable',
                                data: _.clone(param)
                            });
                        }
                        else
                        {
                            entityos._util.protect.oauth.connect.data.externalUserAccess = _.first(response.data.rows);
                            entityos._util.protect.oauth.connect.access(param);
                        }
                    }
                }
             }
        },
		access: function (param, response)
		{
			var object = entityos._util.param.get(param, 'object', { default: 22 }).value;
			var objectContext = entityos._util.param.get(param, 'objectContext').value;
			var accessContext = entityos._util.param.get(param, 'accessContext').value;

			if (objectContext == undefined)
			{
				console.log('!! ER: Missing objectContext');

				entityos._util.sendToView(
				{
					from: 'entityos-protect-oauth-access',
					status: 'error',
					message: 'Missing objectContext',
					data: _.clone(param)
				});
			}
			else
			{
				if (response == undefined)
				{
					var filters =
					{
						object: object,
						objectcontext: objectContext,
						type: 2,
						category: 2
					}

					if (accessContext != undefined)
					{
						filters.guid = accessContext
					}
						
					entityos.cloud.search(
					{
						object: 'core_protect_key',
						fields: ['guid'],
						filters: filters,
						callback: entityos._util.protect.oauth.connect.access,
						callbackParam: param
					});
				}
				else
				{
					if (response.status == 'ER')
					{
						console.log('!!! ER: ' + response.error.errornotes)
					}
					else
					{
						entityos._util.protect.oauth.connect.data.access = _.first(response.data.rows);
						entityos._util.protect.oauth.connect.prepare(param);
					}
				}
			}
		},
        prepare: function(param, response)
        {			
             var object = entityos._util.param.get(param, 'object', {default: 22}).value;
             var objectContext = entityos._util.param.get(param, 'objectContext').value;

             if (objectContext == undefined)
             {
                console.log('!!! Missing objectContext');

                entityos._util.sendToView(
                {
                    from: 'entityos-protect-oauth-prepare',
                    status: 'error',
                    message: 'Missing objectContext',
                    data: _.clone(param)
                });
             }
             else
             {
                if (response == undefined)
                {
					var data = 
					{
						object: object,
						objectcontext: objectContext,
						key: '{{oauth-prepare}}',
						type: 2,
						category: 2
					}

					if (entityos._util.protect.oauth.connect.data.access != undefined)
					{
						data.id = entityos._util.protect.oauth.connect.data.access.id
					}

                    entityos.cloud.save(
                    {
                        object: 'core_protect_key',
                        data: data ,
                        callback: entityos._util.protect.oauth.connect.prepare,
                        callbackParam: param
                    });
                }
                else
                {
                    if (response.status == 'ER')
                    {
                        console.log('!!! ER: ' + response.error.errornotes);

                          entityos._util.sendToView(
                        {
                            from: 'entityos-protect-oauth-prepare',
                            status: 'error',
                            message: response.error.errornotes,
                            data: _.clone(param)
                        });
                    }
                    else
                    {
                        entityos._util.protect.oauth.connect.show(param);
                    }
                }
             }
        },
		show: function (param, response)
		{
			var object = entityos._util.param.get(param, 'object', { default: 22 }).value;
			var objectContext = entityos._util.param.get(param, 'objectContext').value;
			var accessContext = entityos._util.param.get(param, 'accessContext').value;
            var consentURL = entityos._util.param.get(param, 'consentURL', { default: 'https://oauth2.ibcom.biz' }).value;

			if (objectContext == undefined)
			{
				console.log('!! ER: Missing objectContext');

				entityos._util.sendToView(
				{
					from: 'entityos-protect-oauth-show',
					status: 'error',
					message: 'Missing objectContext',
					data: _.clone(param)
				});
			}
			else
			{
				if (response == undefined)
				{
					var filters =
					{
						object: object,
						objectcontext: objectContext,
						type: 2,
						category: 2
					}

					if (accessContext != undefined)
					{
						filters.guid = accessContext
					}

					entityos.cloud.search(
					{
						object: 'core_protect_key',
						fields: ['guid'],
						filters: filters,
						callback: entityos._util.protect.oauth.connect.show,
						callbackParam: param
					});
				}
				else
				{
					if (response.status == 'ER')
					{
						console.log('!!! ER: ' + response.error.errornotes)
					}
					else
					{
						if (response.data.rows.length == 0)
						{
							console.log('!! ER: No Access Prepared - Use entityos._util.protect.oauth.connect.init');

							entityos._util.sendToView(
							{
								from: 'entityos-protect-oauth-show',
								status: 'error',
								message: 'No Access Enabled - Use entityos._util.protect.oauth.connect.init',
								data: _.clone(param)
							});
						}
						else
						{
							entityos._util.protect.oauth.connect.data.access = _.first(response.data.rows);

							entityos._util.protect.oauth.connect.data.s = entityos._util.protect.oauth.connect.data.externalUserAccess.guid;

							entityos._util.protect.oauth.connect.data._h = entityos._util.protect.hash(
							{
								data: entityos._util.protect.oauth.connect.data.externalUserAccess.guid + '-' + entityos._util.protect.oauth.connect.data.externalUserAccess.etag,
								hashOutput: 'Base64'
							}).dataHashed;

							entityos._util.protect.oauth.connect.data.h = encodeURIComponent(entityos._util.protect.oauth.connect.data._h);
							entityos._util.protect.oauth.connect.data.c = entityos._util.protect.oauth.connect.data.access.guid;
							
							entityos._util.protect.oauth.connect.data.url = 
								consentURL + 
								'?s=' + entityos._util.protect.oauth.connect.data.s +
								'&h=' + entityos._util.protect.oauth.connect.data.h +
								'&c=' + entityos._util.protect.oauth.connect.data.c;

							param.url = entityos._util.protect.oauth.connect.data.url;
							param.data = entityos._util.protect.oauth.connect.data;

							console.log(entityos._util.protect.oauth.connect.data)

							entityos._util.onComplete(param);
						}
					}
				}
			}
		}
    }
};


entityos._util.factory.protect = function (param)
{
	entityos._util.controller.add(
	[
         {
            name: 'util-protect-oauth-connect-init',
            code: function (param)
            {
                return entityos._util.protect.oauth.connect.init(param)
            }
        },
        {
            name: 'util-protect-available',
            code: function (param)
            {
                return entityos._util.protect.available(param)
            }
        },
        {
            name: 'util-protect-encrypt',
            code: function (param)
            {
                return entityos._util.protect.encrypt(param)
            }
        },
        {
            name: 'util-protect-decrypt',
            code: function (param)
            {
                return entityos._util.protect.decrypt(param)
            }
        },
        {
            name: 'util-protect-key-create',
            code: function (param)
            {
                return entityos._util.protect.key.create.single(param)
            }
        },
        {
            name: 'util-protect-key-search',
            code: function (param)
            {
                return entityos._util.protect.key.create.search(param)
            }
        },
        {
            name: 'util-protect-hash',
            code: function (param)
            {
                return entityos._util.protect.hash(param)
            }
        }
    ]);
}
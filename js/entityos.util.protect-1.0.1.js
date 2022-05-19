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
        var cryptoKeyReference = entityos._util.param.get(param, 'cryptoKeyReference').value;

        if (cryptoKey == undefined && cryptoKeyReference != undefined)
        {
            cryptoKey = entityos._util.protect.key.data[cryptoKeyReference];
        }

        if (cryptoKey != undefined)
        {
            var data = entityos._util.param.get(param, 'data', {remove: true}).value;

            var protectedData = CryptoJS.AES.encrypt(data, cryptoKey).toString();

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
        var cryptoKeyReference = entityos._util.param.get(param, 'cryptoKeyReference').value;

        if (cryptoKey == undefined && cryptoKeyReference != undefined)
        {
            cryptoKey = entityos._util.protect.key.data[cryptoKeyReference];
        }

        if (cryptoKey != undefined)
        {
            var protectedData = entityos._util.param.get(param, 'protectedData', {remove: true}).value;
            var data = CryptoJS.AES.decrypt(protectedData, cryptoKey).toString(CryptoJS.enc.Utf8);

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

entityos._util.factory.protect = function (param)
{
	entityos._util.controller.add(
	[
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
/*
	Utility for identity.
	SSI DIDs etc
	OAuth

	Uses entityos.protect namespace
	
*/

entityos._util.identity =
{
	data: {},

	oauth:
	{
		connect:
		{
			data: {},
			enable: function (param, response) {
				if (response == undefined) {
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
				else {
					console.log(response);
					entityos._util.onComplete(param, response);
				}
			},
			init: function (param, response) {
				var objectContext = entityos._util.param.get(param, 'objectContext').value;

				if (objectContext == undefined) {
					console.log('!! ER: Missing objectContext');

					entityos._util.sendToView(
						{
							from: 'entityos-protect-oauth-init',
							status: 'error',
							message: 'Missing objectContext',
							data: _.clone(param)
						});
				}
				else {
					if (response == undefined) {
						entityos.cloud.search(
							{
								object: 'setup_external_user_access',
								fields: ['guid', 'etag', 'createddate', 'notes'],
								filters: { userlogon: 'connect@ibcom' },
								callback: entityos._util.protect.oauth.connect.init,
								callbackParam: param
							});
					}
					else {
						if (response.status == 'ER') {
							console.log('!!! ER: ' + response.error.errornotes)
						}
						else {
							if (response.data.rows.length == 0) {
								console.log('!! ER: No Access Enabled - Use entityos._util.protect.oauth.connect.enable');

								entityos._util.sendToView(
									{
										from: 'entityos-protect-oauth-init',
										status: 'error',
										message: 'No Access Enabled - Use entityos._util.protect.oauth.connect.enable',
										data: _.clone(param)
									});
							}
							else {
								entityos._util.protect.oauth.connect.data.externalUserAccess = _.first(response.data.rows);
								entityos._util.protect.oauth.connect.access(param);
							}
						}
					}
				}
			},
			access: function (param, response) {
				var object = entityos._util.param.get(param, 'object', { default: 22 }).value;
				var objectContext = entityos._util.param.get(param, 'objectContext').value;
				var accessContext = entityos._util.param.get(param, 'accessContext').value;

				if (objectContext == undefined) {
					console.log('!! ER: Missing objectContext');

					entityos._util.sendToView(
						{
							from: 'entityos-protect-oauth-access',
							status: 'error',
							message: 'Missing objectContext',
							data: _.clone(param)
						});
				}
				else {
					if (response == undefined) {
						var filters =
						{
							object: object,
							objectcontext: objectContext,
							type: 2,
							category: 2
						}

						if (accessContext != undefined) {
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
					else {
						if (response.status == 'ER') {
							console.log('!!! ER: ' + response.error.errornotes)
						}
						else {
							entityos._util.protect.oauth.connect.data.access = _.first(response.data.rows);
							entityos._util.protect.oauth.connect.prepare(param);
						}
					}
				}
			},
			prepare: function (param, response) {
				var object = entityos._util.param.get(param, 'object', { default: 22 }).value;
				var objectContext = entityos._util.param.get(param, 'objectContext').value;

				if (objectContext == undefined) {
					console.log('!!! Missing objectContext');

					entityos._util.sendToView(
						{
							from: 'entityos-protect-oauth-prepare',
							status: 'error',
							message: 'Missing objectContext',
							data: _.clone(param)
						});
				}
				else {
					if (response == undefined) {
						var data =
						{
							object: object,
							objectcontext: objectContext,
							key: '{{oauth-prepare}}',
							type: 2,
							category: 2
						}

						if (entityos._util.protect.oauth.connect.data.access != undefined) {
							data.id = entityos._util.protect.oauth.connect.data.access.id
						}

						entityos.cloud.save(
							{
								object: 'core_protect_key',
								data: data,
								callback: entityos._util.protect.oauth.connect.prepare,
								callbackParam: param
							});
					}
					else {
						if (response.status == 'ER') {
							console.log('!!! ER: ' + response.error.errornotes);

							entityos._util.sendToView(
								{
									from: 'entityos-protect-oauth-prepare',
									status: 'error',
									message: response.error.errornotes,
									data: _.clone(param)
								});
						}
						else {
							entityos._util.protect.oauth.connect.show(param);
						}
					}
				}
			},
			show: function (param, response) {
				var object = entityos._util.param.get(param, 'object', { default: 22 }).value;
				var objectContext = entityos._util.param.get(param, 'objectContext').value;
				var accessContext = entityos._util.param.get(param, 'accessContext').value;
				var consentURL = entityos._util.param.get(param, 'consentURL', { default: 'https://oauth2.ibcom.biz' }).value;

				if (objectContext == undefined) {
					console.log('!! ER: Missing objectContext');

					entityos._util.sendToView(
						{
							from: 'entityos-protect-oauth-show',
							status: 'error',
							message: 'Missing objectContext',
							data: _.clone(param)
						});
				}
				else {
					if (response == undefined) {
						var filters =
						{
							object: object,
							objectcontext: objectContext,
							type: 2,
							category: 2
						}

						if (accessContext != undefined) {
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
					else {
						if (response.status == 'ER') {
							console.log('!!! ER: ' + response.error.errornotes)
						}
						else {
							if (response.data.rows.length == 0) {
								console.log('!! ER: No Access Prepared - Use entityos._util.protect.oauth.connect.init');

								entityos._util.sendToView(
									{
										from: 'entityos-protect-oauth-show',
										status: 'error',
										message: 'No Access Enabled - Use entityos._util.protect.oauth.connect.init',
										data: _.clone(param)
									});
							}
							else {
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
	},

	ssi:
	{
		types: function (param)
		{
			var typeName = entityos._util.param.get(param, 'typeName').value;

			let types =
			[
				{
					name: 'id',
					notes: 'Can be provided or generated (uuid, guid, random text)'
				},
				{
					name: 'curve',
					notes: 'Based curve [Secp256k1 Ed25519] as public key hash',
					curves: [
						{
							name: 'secp256k1',
							keyType: 'EcdsaSecp256k1VerificationKey2019',
							publicKey:
							{
								name: 'publicKeyHex',
								encoding: 'hex',
								hashType: 'sha256'
							}
						},
						{
							name: 'ed25519',
							keyType: 'Ed25519SignatureAuthentication2018',
							publicKey:
							{
								name: 'publicKeyBase58',
								encoding: 'base58',
								hashType: 'sha256'
							}
						}
					]
				},
				{
					name: 'cardano',
					notes: 'Based on Cardano address as public key hash'
				}
			]

			if (typeName != undefined)
			{
				types = _.find(types, function (type) {return type.name == typeName})
			}

			return types;
		},
		init: function (param)
		{			
			var typeName = entityos._util.param.get(param, 'typeName').value;

			let initOK = (typeName != undefined)

			if (initOK)
			{
				var didType = entityos._util.identity.ssi.types(param); //typeName:
				initOK = (didType != undefined);
			}

			if (initOK)
			{
				if (didType.name == 'curve')
				{
					initOK = (_.has(window, 'elliptic.ec'));

					if (!initOK)
					{
						console.log('!! You need to reference elliptic.min.js (https://github.com/indutny/elliptic).');
					}
				}
			}

			if (_.get(param, 'onComplete') != undefined) // eg entityos._util.identity.ssi.create.did.id
			{
				_.set(param, 'initOK', initOK);
				return entityos._util.onComplete(param, {initOK: initOK})
			}
			else
			{
				return initOK;
			}
		},
		create:
		{
			did:
			{
				init: function (param)
				{
					//e.g. app.invoke('util-identity-ssi-create-did-init', {typeName: 'curve'})
					//e.g. app.invoke('util-identity-ssi-create-did-init', {typeName: 'curve', asDocument: true})

					var did = {_type: entityos._util.identity.ssi.types(param)};
					var asDocument = entityos._util.param.get(param, 'asDocument', {default: false}).value;

					if (did._type == undefined)
					{
						did.error = '!! Not a valid Type',
						did.errorNotes = entityos._util.identity.ssi.types();
						console.log('!! Not a valid Type')
					}
					else
					{
						did.typeName = did._type.name;

						if (did._type.name == 'id')
						{
							did.id = entityos._util.uuid(param)
						}
						
						if (did._type.name == 'curve')
						{
							did.curveName = entityos._util.param.get(param, 'curveName', {default: 'ed25519'}).value;

							did._curve = _.find(did._type.curves, function (curve)
							{
								return (curve.name == did.curveName)
							});

							const cryptoKeyFormat = entityos._util.param.get(param, 'cryptoKeyFormat', { default: 'hex' }).value;

							// Check curveName against did._type.curves

							const ec = new elliptic.ec(did.curveName);
							const key = ec.genKeyPair();

							did.keys =
							{
								public: {hex: key.getPublic(cryptoKeyFormat)},
								private: {hex: key.getPrivate(cryptoKeyFormat)}
							}

							did.keys.public.base58 = entityos._util.hex.toBase58(did.keys.public.hex);
							did.keys.public.hexSHA256 = entityos._util.protect.hash({data: did.keys.public.hex}).dataHashed;
							did.keys.public.base58SHA256 = entityos._util.protect.hash({data: did.keys.public.base58}).dataHashed;

							did._id = {hexSHA256: did.keys.public.hexSHA256, base58SHA256: did.keys.public.base58SHA256}
							did.id = did.keys.public[did._curve.publicKey.encoding];
							if (did._curve.publicKey.hashType != undefined)
							{
								did.id = entityos._util.protect.hash({data: did.id, hashType: did._curve.publicKey.hashType.toUpperCase()}).dataHashed;
							}
						}

						if (did._type.name == 'cardano')
						{
							// Get public address using CIP-30 Connector - see /site/2007/util.on-chain
							// Then hash etc
							// And store -- if not storing then just createDoc
						}
					}

					if (asDocument)
					{
						param = _.assign(param, {did: did});
						return app.invoke('util-identity-ssi-create-did-document', param);
					}
					else
					{
						return did;
					}
				},
				document: function (param)
				{			
					//e.g. app.invoke('util-identity-ssi-create-did-document', {did: did})

					const nameFormat = entityos._util.param.get(param, 'nameFormat', {default: 'entityos'}).value;
					const formatted = entityos._util.param.get(param, 'formatted', {default: false}).value;
					//const publicKeyHashType = entityos._util.param.get(param, 'publicKeyHashType', {default: 'SHA256'}).value; //sha256

					let did = entityos._util.param.get(param, 'did', {default: {}}).value;

					if (did._type == undefined)
					{
						did._type = entityos._util.identity.ssi.types(param); //based on typeName:
					}
									
					let didDocument;

					if (did._type == undefined)
					{}
					else
					{
						if (did._type.name == 'id')
						{
							didDocument = {id: 'did:' + nameFormat + ':' + did.id} // todo: hash if set
						}

						if (did._type.name == 'curve')
						{
							if (did._curve == undefined)
							{
								did._curve = _.find(did._type.curves, function (ssiCurve) {return ssiCurve.name == did.curveName})
							}

							if (did._curve != undefined)
							{
								if (did.id == undefined)
								{
									//nameFormat eg 'entityos'
									did.id = 'did:' + nameFormat + ':'  // + based on curve details and the did passed ie after .create

									if (!_.has(did._curve, 'publicKey.hashType'))
									{
										did.id += did.keys.public[did._curve.publicKey.encoding]
									}
									else
									{
										did.id += entityos._util.protect.hash({data: did.keys.public.hex, hashType: did._curve.publicKey.hashType.toUpperCase()}).dataHashed;
									}
								}

								didDocument = {
									id: did.id,
									verificationMethod:
									[
										{
											id: did.id + '#keys-1',
											type: did._curve.keyType,
											controller: did.id
										}
									],
									authentication:
									[
										{
											type: did._curve.keyType,
											publicKey: did.id + '#keys-1'
										}
									]
								}

								_.each(didDocument.verificationMethod, function (method)
								{
									method[did._curve.publicKey.name] = did.keys.public[did._curve.publicKey.encoding];
								});
							}
						}
					}

					if (_.get(param, 'onComplete') != undefined) // eg entityos._util.identity.ssi.create.did
					{
						_.set(param, 'didDocument', didDocument);
						entityos._util.onComplete(param, {didDocument: didDocument})
					}
					else
					{
						if (formatted)
						{
							didDocument = JSON.stringify(didDocument);
						}

						return didDocument;
					}
				}
			},
			credential: 
			{
				init: function (param)
				{
					//based on on-cloud action - sign locally etc
				},
				sign: function (param)
				{
					//based on on-cloud private keys or local keys or on-chain keys (Cardano Wallet)
				}
			}
		},
		save:
		{
			did: 
			{
				id: function (param)
				{
					//local, on-cloud / on-chain
				},
				document: function (param)
				{
					//local, on-cloud / on-chain
				}
			}
		}
	}
};

if (_.has(entityos, '_util.protect.oauth'))
{
	entityos._util.protect.oauth = entityos._util.identity.oauth
}


//SSI
//https://docs.walt.id/v/ssikit/ssi-kit/what-is-ssi/technologies-and-concepts/verifiable-credentials-vcs-and-verifiable-presentations-vps

entityos._util.factory.identity = function (param)
{
	entityos._util.controller.add(
	[
		{
			name: 'util-protect-oauth-connect-init',
			code: function (param) {
				return entityos._util.protect.oauth.connect.init(param)
			}
		},
	]);

	entityos._util.controller.add(
	[
		{
			name: 'util-identity-ssi-init',
			code: function (param) {
				return entityos._util.identity.ssi.init(param)
			}
		},
		{
			name: 'util-identity-ssi-create-did-init',
			code: function (param) {
				return entityos._util.identity.ssi.create.did.init(param)
			}
		},
		{
			name: 'util-identity-ssi-create-did-document',
			code: function (param) {
				return entityos._util.identity.ssi.create.did.document(param)
			}
		},

	]);
}

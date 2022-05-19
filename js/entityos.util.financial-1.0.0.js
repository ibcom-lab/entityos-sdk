/*
    {
        title: "Util; Financial",
    }
*/

/*!
 * ibCom Pty Ltd ATF ibCom Unit Trust & contributors
 * Licensed as Attribution-ShareAlike 4.0 International
 * http://creativecommons.org/licenses/by-sa/4.0/
 *
 * http://www.larryullman.com/2012/12/05/writing-the-javascript-code-for-handling-stripe-payments/
 * https://bootsnipp.com/snippets/featured/responsive-stripe-payment-form
 *
 * Example /paynow;

    <script src="/jscripts/jquery-1.8.3.min.js"></script>
    <script src="https://js.stripe.com/v3/"></script>
    <script src="/site/312/1blankspace.util.site.collect-1.0.0.js"></script>
    <p>Pay Now</p>
    <div id="ns1blankspaceUtilFinancialStripeContainer"></div>

    //FLOW
    //Stripe: Elements;
    //1. Create a page with HTML container with data-ui="elements"
    //2. Get the Context; ie the invoice number, amount etc - via hash or direct passed if admin doing it
    //3. Get the stripe public key from financial account based on accountID set in the app options or passed
    //4. User enters card details 
    //5. Details tokenised by stripe
    //6. Tokenised details sent to Stripe with private key via site_collect_payment_stripe method
    //7. Response handled
 */

"use strict";

if (entityos._util.financial == undefined) {entityos._util.financial = {}}
if (entityos._util.financial.collect === undefined) {entityos._util.financial.collect = {}}

/*$(document).ready(function()
{  
   entityos._util.financial.collect.getContext()
});*/


entityos._util.financial.collect =
{
    data: {_publicKey: undefined, _siteAccount: undefined, context: {currency: 'AUD'}},
    option: {autoReceipt: true},
    provider: {},

    getContext: function (param)
    {  
        var hashContexts = [];
        var context = {};

       if (window.location.hash != '')
        {
            hashContexts = window.location.hash.replace('#', '').split('|');
        }

        _.each(hashContexts, function (hashContext)
        {
            context[hashContext.split('=')[0]] = hashContext.split('=')[1]
        })

        entityos._util.financial.collect.data.context =
            _.assign(context, entityos._util.financial.collect.data.context);
        
        entityos._util.financial.collect.init(context)
    },

    init: function (param)
    {    
        if (window.location.protocol == 'http:')
        {
            window.location.href = window.location.href.replace('http', 'https')
        }
        else
        {
        	//Get stripe public key from _scope.
            entityos._util.financial.collect.data.context = param;

			var collect = entityos._util.financial.collect;

			collect.data.xhtmlContainer = $('#util-financial-collect-container-stripe');

			collect.data.xhtmlContainerSuccess = $('#util-financial-collect-container-stripe-success');

			collect.option.stripe = (collect.data.xhtmlContainer != undefined)

			if (collect.option.stripe && window.Stripe == undefined)
			{
				collect.option.stripe = false
			}

			if (collect.option.stripe)
			{
                if (collect.data._publicKey == undefined)
                {
                    collect.data._publicKey = collect.data.context.publicKey;
                }

				if (collect.data._publicKey == undefined)
				{
					collect.data._publicKey = window.stripePublicKey;
				}

                if (collect.data._siteAccount == undefined)
                {
                    collect.data._siteAccount = collect.data.context.account;
                }

                if (collect.data._siteAccount == undefined)
                {
                    collect.data._siteAccount = window.siteAccount;
                }

				collect.option.elements = (collect.data.xhtmlContainer.attr('data-ui') == 'elements')

				collect.stripe.init(param);
			}    
        }    
    },

    error: function (error)
    {
        entityos._util.financial.collect.data.xhtmlContainer.html(error)
    },

    stripe:
    {
        data: {},

        init: function (param, response)
        {
        	var collect = entityos._util.financial.collect;

            if (response == undefined)
            {
                if (collect.data._publicKey != undefined)
                {
                    collect.stripe.init(param,
                    {
                        data: {rows: [{apikey: collect.data._publicKey}]},
                        status: 'OK'
                    }); 
                }
                else
                {
                    entityos.cloud.search(
                    {
                        object: 'site_funds_transfer_account',
                        fields: ['apikey'],
                        filters:
                        [
                            {
                                field: 'id',
                                value: collect.data._siteAccount
                            }
                        ],
                        callback: entityos._util.financial.collect.stripe.init,
                        callbackParam: param
                    });
                }    
            }
            else
            {
                if (response.status == 'OK')
                {
                    if (response.data.rows.length > 0)
                    {
                        collect.data._publicKey = _.first(response.data.rows).apikey;
                        collect.provider.stripe = Stripe(collect.data._publicKey);
                        collect.stripe.render(param);
                    }
                    else
                    {
                        collect.error('Error: No public key set up.')
                    }
                   
                }
                else
                {
                    collect.error('Error in getting key public key.')
                }
            }    
        },

		render: function (param)
		{ 
			var collect = entityos._util.financial.collect;

			if (collect.data.xhtmlContainer.html() == '')
			{
				console.log('STRIPE ERROR NO HTML');
                //DO FUNCTION TO CREATE STANDARD HTML AS PER .HTML FILE

				/*$.ajax(
				{
				type: 'GET',
				url: window.location.protocol + '//' + window.location.host + '/site/' + entityosSiteId + '/1blankspace.util.site.collect-1.0.0.html',
				dataType: 'text',
				global: false,
				success: function(data)
				{
				if (data != '')
				{
				ns1blankspace.util.site.collect.data.xhtmlContainer.html(data);
				ns1blankspace.util.site.collect.stripe.render(param);
				} 
				},
				error: function(data)
				{
				ns1blankspace.util.site.collect.error('No payment collection template');
				}
				});*/
			}
			else
			{                
				collect.data.xhtmlContainerSuccess.hide();
				collect.data.xhtml = collect.data.xhtmlContainer.html();
                var amount = entityos._util.param.get(param, 'amount', {default: ''}).value;

                collect.data.xhtml = collect.data.xhtml.replace(/\[\[Amount\]\]/g, amount);
                
				collect.data.xhtmlContainer.html(collect.data.xhtml);

				if (collect.option.elements)
				{
					collect.stripe.createCard(param);
				}
				else
				{
					collect.stripe.bind(param);
				}
			}
		},

        createCard: function (param)
        {        
            var collect = entityos._util.financial.collect;

            collect.provider.elements = collect.provider.stripe.elements();

            collect.data.style =
            {
                base:
                {
                    color: '#32325d',
                    lineHeight: '18px',
                    fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                    fontSmoothing: 'antialiased',
                    fontSize: '16px',
                    '::placeholder':
                    {
                        color: '#aab7c4'
                    }
                },
                invalid:
                {
                    color: '#fa755a',
                    iconColor: '#fa755a'
                }
            }

            collect.provider.card = collect.provider.elements.create('card',
                {style: collect.data.style});

            collect.provider.card.mount('#card-element');

            collect.stripe.bind(param);
        },

        bind: function (param)
        {
             //CHECK HTML IDS
            var collect = entityos._util.financial.collect;

            $("#util-financial-collect-container").submit(function(event)
            {
                event.preventDefault();

                //CHECK ID
                if ($('#entityos-financial-collect-collect-process').length == 0)
                {
                    collect.stripe.getToken()
                }   
            });

            /* $("#entityos-util-financial-collect-container").submit(function(event)
            {
                event.preventDefault();

                if ($('#entityos-financial-collect-collect-process').length == 0)
                {
                    entityos._util.financial.collect.stripe.getToken();
                }
            });*/

            $('#util-financial-collect-collect-process').click(function(event)
            {
                var collect = entityos._util.financial.collect;

                if (collect.option.elements)
                {
                    collect.stripe.getToken();
                }
                else
                {
                    collect.stripe.process();
                }    
            });

            if (collect.option.elements)
            {
                collect.provider.card.addEventListener('change', function(event)
                {
                    if (event.error)
                    {
                        collect.data.error = true;
                        $('#entityos-util-financial-collect-card-errors').addClass('alert alert-danger');
                        $('#entityos-util-financial-collect-card-errors').html(event.error.message);
                    }
                    else
                    {
                        collect.data.error = false;
                        $('#entityos-util-financial-collect-card-errors').removeClass('alert alert-danger');
                        $('#entityos-util-financial-collect-card-errors').html('');
                    }
                });
            }    
        },

        process: function (param)
        {
			//If not using Stripe Elements
            var collect = entityos._util.financial.collect;

			if (param == undefined) {param = {}}
			param.error = false;
			param.errorMessages = [];

			param.number = $('.card-number').val();
			if (param.number == undefined) {param.number = $('.number').val()}

			param.cvc = $('.card-cvc').val();
			if (param.cvc == undefined) {param.cvc = $('.cvc').val()}

			param.exp_month = $('.card-expiry-month').val();
			if (param.exp_month == undefined) {param.exp_month = $('.expiry-month').val()}

			param.exp_year = $('.card-expiry-year').val();
			if (param.exp_year == undefined) {param.exp_year = $('.expiry-year').val()}

			if ((param.exp_year == undefined || param.exp_year == '')
			&& (param.exp_month == undefined || param.exp_month == ''))
			{
				param.expiry = $('.expiry').val();
				if (param.expiry != undefined)
				{
					var aExpiry = param.expiry.split('/');
					if (aExpiry.length > 0)
					{
						param.exp_month = aExpiry[0];
						param.exp_year = aExpiry[1];
					}    
				}
			}

			if (!Stripe.card.validateCardNumber(param.number))
			{
				param.error = true;
				param.errorMessages.push('<div>The credit card number appears to be invalid.</div>');
			}

			if (!Stripe.card.validateCVC(param.cvc))
			{
				param.error = true;
				param.errorMessages.push('<div>The CVC number appears to be invalid.</div>');
			}

			if (!Stripe.card.validateExpiry(param.exp_month, param.exp_year))
			{
				param.error = true;
				param.errorMessages.push('<div>The expiration date appears to be invalid.</div>');
			}

			if (!param.error)
			{
				collect.provider.stripe.getToken()
			}
			else
			{
				collect.error(param.errorMessages.join(''));
			}
        },  

        getToken: function (param)
        {
             var collect = entityos._util.financial.collect;

            //CHECK ID
            $('#util-financial-collect-process').addClass('disabled').prop('disabled', true);

            collect.provider.stripe.createToken(collect.provider.card)
            .then(function(result)
            {
                if (result.error)
                {
                    collect.stripe.error(result.error.message);
                }
                else
                {
                    collect.stripe.processToken(result.token);
                }
            });
        },

        processToken: function (token)
        {
            var collect = entityos._util.financial.collect;

            if (token != undefined)
            {
                var currency = collect.data.context.currency;
                if (currency == undefined) {currency = 'AUD'}

                var data =
                {
                    token: token.id,
                    currency: currency,
                    amount: collect.data.context.amount,
                    invoiceGUID: collect.data.context.invoiceGUID,
                    description: collect.data.context.description,
                    account: collect.data._siteAccount,
                    site: window.entityosSiteId
                }

                entityos.cloud.invoke(
                {
                    method: 'site_collect_payment_stripe',
                    data: data,
                    callback: entityos._util.financial.collect.stripe.processTokenResponse,
                    callbackParam: token
                });

               /* $.ajax(
                {
                    type: 'POST',
                    url: '/rpc/site/?method=SITE_COLLECT_PAYMENT_STRIPE',
                    data: oData,
                    dataType: 'json',
                    success: function (data)
                    {
                        ns1blankspace.util.site.collect.stripe.processComplete(data);
                    },
                    error: function (data)
                    {
                        ns1blankspace.util.site.collect.stripe.error(data.responseJSON.error.errornotes)
                    }
                });*/
            }
            else
            {
                collect.error('Bad token')
            }    
        },

        processTokenResponse: function (param, response)
        {
            var error = false;
            var collect = entityos._util.financial.collect;

            if (error)
            {
                console.log('STRIPE ERROR');
                console.log(response);
                collect.error(data.responseJSON.error.errornotes);
            }
            else
            {
                collect.stripe.processComplete(response);
            }
        },

        processComplete: function (response)
        {
            var collect = entityos._util.financial.collect;

            if (response.status == 'OK')
            {
                if (response.stripe_status == 'succeeded')
                {
                    if (collect.option.autoReceipt)
                    {   
                        collect.stripe.autoReceipt({chargeToken: response.stripe_id})
                    }
                    else
                    {
                        collect.data.xhtmlContainer.hide();
                        collect.data.xhtmlContainerSuccess.show();
                    }
                }
                else
                {
                    collect.stripe.error(response.stripe_outcome_sellermessage)
                }
            }
            else
            {
               collect.data.xhtmlContainer.html('<h3>There is something wrong with the set up of this page!')
            }
        },

        autoReceipt: function (param, response)
        {
             var collect = entityos._util.financial.collect;

            if (response == undefined)
            {
                var data =
                {
                    amount: collect.data.context.amount,
                    guid: collect.data.context.invoiceGUID,
                    description: param.chargeToken  
                }

                // site: window.entityosSiteId

                entityos.cloud.invoke(
                {
                    method: 'site_auto_receipt',
                    data: data,
                    callback: entityos._util.financial.collect.stripe.autoReceipt,
                    callbackParam: param
                });

               /* $.ajax(
                {
                    type: 'POST',
                    url: '/rpc/site/?method=SITE_AUTO_RECEIPT',
                    data: oData,
                    dataType: 'json',
                    success: function (data)
                    {
                        entityos._util.financial.collect.stripe.autoReceipt(param, data);
                    }
                });*/
            }
            else
            {
                if (response.status == 'ER')
                {
                    collect.stripe.error(response.error.errornotes)
                }
                else
                {
                    collect.data.xhtmlContainer.hide();
                    collect.data.xhtmlContainerSuccess.show();
                }
            }    
        },

        error: function (message)
        {
            $('#card-errors').html(message).addClass('alert alert-danger');
            $('#site-collect-process').prop('disabled', false);
            return false;
        }

       
    }
}

entityos._util.factory.financial = function (param)
{
    app.add(
    [
        {
            name: 'util-financial-collect-initialise',
            code: function (param)
            {
                entityos._util.financial.collect.init(param);
            }
        }
    ]);
}



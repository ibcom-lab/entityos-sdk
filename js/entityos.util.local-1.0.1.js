entityos._util.factory.local = function (param)
{
    entityos._util.controller.add(
    {
        name: 'util-local-cache-save',
        code: function (param)
        {
            var key = entityos._util.param.get(param, 'key').value;
            var persist = entityos._util.param.get(param, 'persist', {"default": false}).value;
            var storage = (persist?localStorage:sessionStorage);
            var data = entityos._util.param.get(param, 'data').value;

            if (typeof data !== 'string')
            {
                data = JSON.stringify(data);
            }

            storage.setItem(key, data);

            entityos._util.onComplete(param);
        }
    });

    entityos._util.controller.add(
    {
        name: 'util-local-cache-search',
        code: function (param)
        {
            var key = entityos._util.param.get(param, 'key').value;
            var persist = entityos._util.param.get(param, 'persist', {"default": false}).value;
            var storage = (persist?localStorage:sessionStorage);
            var isJSON = entityos._util.param.get(param, 'isJSON', {"default": key.toLowerCase().indexOf('.json') != -1}).value;
            var onComplete = entityos._util.param.get(param, 'onComplete').value;

            var data = storage.getItem(key);

            if (data == null) {data = undefined}

            if (isJSON && data !== undefined)
            {
                data = JSON.parse(data);
            }

            if (onComplete != undefined)
            {
                param = entityos._util.param.set(param, 'data', data);
                entityos._util.onComplete(param);
            }
            else
            {
                return data;
            }
        }
    });

    entityos._util.controller.add(
    {
        name: 'util-local-cache-remove',
        code: function (param)
        {
            var key = entityos._util.param.get(param, 'key').value;
            var persist = entityos._util.param.get(param, 'persist', {"default": false}).value;
            var storage = (persist?localStorage:sessionStorage);
            var all = entityos._util.param.get(param, 'all', {"default": false}).value;

            if (all)
            {
                storage.clear()
            }
            else
            {
                storage.removeItem(key);
            }	

            entityos._util.onComplete(param);
        }
    });
}
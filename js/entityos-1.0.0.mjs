function entityOSCloud ()
{
    return entityos.cloud;
}

function entityOSInvoke (controllerName)
{
    return entityos._util.controller.invoke(controllerName)
}

export { entityOSCloud, entityOSInvoke };
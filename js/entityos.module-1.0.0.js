function entityOSInvoke (controllerName, controllerParam)
{
    return entityos._util.controller.invoke(controllerName, controllerParam)
}

export { entityOSInvoke };
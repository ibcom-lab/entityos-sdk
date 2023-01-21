class EntityOS {
    invoke(controllerName, controllerParam)
    {
         return entityos._util.controller.invoke(controllerName, controllerParam)
    }
}

export { EntityOS };
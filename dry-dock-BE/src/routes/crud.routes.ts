import { Router } from 'express'
import { BaseController } from '../core/BaseController'
import { BaseModel } from '../core/BaseModel'

export function crudRoutes(controller: BaseController<BaseModel>) {
  const router = Router()
  router.get('/', controller.index)
  router.get('/:id', controller.show)
  router.post('/', controller.store)
  router.put('/:id', controller.update)
  router.delete('/:id', controller.destroy)
  return router
}
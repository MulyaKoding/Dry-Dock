import { Router } from 'express'
import { crudRoutes } from './crud.routes'
import { VesselController } from '../controllers/VesselController'
import { ShipyardController } from '../controllers/ShipyardController'
import { SpecificationGroupController } from '../controllers/SpecificationGroupController'
import { DryDockController } from '../controllers/DryDockController'
import { WorkOrderController } from '../controllers/WorkOrderController'
import { YardQuoteController } from '../controllers/YardQuoteController'
import { DashboardController } from '../controllers/DashboardController'
import { ChecklistController } from '../controllers/ChecklistController'

const router = Router()

const yardQuoteController = new YardQuoteController()
const dashboardController = new DashboardController()
const checklistController = new ChecklistController()
const workOrderController = new WorkOrderController()
const dryDockController = new DryDockController()

router.get('/dashboard/overview', dashboardController.getOverview)

router.use('/vessels', crudRoutes(new VesselController()))
router.use('/shipyards', crudRoutes(new ShipyardController()))
router.use('/specification-groups', crudRoutes(new SpecificationGroupController()))
router.use('/dry-docks', crudRoutes(dryDockController))

router.post('/work-orders/:id/attach', workOrderController.attach)
router.use('/work-orders', crudRoutes(workOrderController))

router.use('/checklists', crudRoutes(checklistController))

router.patch('/yard-quotes/:id/status', yardQuoteController.updateStatus)
router.put('/yard-quotes/:id/status', yardQuoteController.updateStatus)
router.use('/yard-quotes', crudRoutes(yardQuoteController))

export default router
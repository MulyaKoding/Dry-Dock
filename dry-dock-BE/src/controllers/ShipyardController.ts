import { BaseController } from '../core/BaseController'
import { ShipyardModel } from '../models/ShipyardModel'

export class ShipyardController extends BaseController<ShipyardModel> {
  constructor() {
    super(new ShipyardModel())
  }
}
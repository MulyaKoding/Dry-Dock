import { BaseController } from '../core/BaseController'
import { VesselModel } from '../models/VesselModel'

export class VesselController extends BaseController<VesselModel> {
  constructor() {
    super(new VesselModel())
  }
}
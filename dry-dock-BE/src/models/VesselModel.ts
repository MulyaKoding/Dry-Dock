import { BaseModel } from '../core/BaseModel'

export class VesselModel extends BaseModel {
  constructor() {
    super('vessels', ['name', 'photo_url'])
  }
}
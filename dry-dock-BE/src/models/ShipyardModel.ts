import { BaseModel } from '../core/BaseModel'

export class ShipyardModel extends BaseModel {
  constructor() {
    super('shipyards', ['name', 'photo_url'])
  }
}
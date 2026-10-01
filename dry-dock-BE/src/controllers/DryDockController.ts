import { Request, Response } from 'express'
import { BaseController } from '../core/BaseController'
import { DryDockModel } from '../models/DryDockModel'

export class DryDockController extends BaseController<DryDockModel> {
  constructor() {
    super(new DryDockModel())
  }

  index = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.model.findAllWithDetails())
  }

  show = async (req: Request, res: Response): Promise<void> => {
    const row = await this.model.findByIdWithDetails(Number(req.params.id))
    if (!row) {
      res.status(404).json({ message: 'Dry dock tidak ditemukan' })
      return
    }
    res.json(row)
  }
}

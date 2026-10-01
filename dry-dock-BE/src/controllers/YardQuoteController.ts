import { Request, Response } from 'express'
import { BaseController } from '../core/BaseController'
import { YardQuoteModel } from '../models/YardQuoteModel'

export class YardQuoteController extends BaseController<YardQuoteModel> {
  constructor() {
    super(new YardQuoteModel())
  }

  index = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.model.findAllWithDetails())
  }

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id)
    const { status } = req.body
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      res.status(400).json({ message: 'Status tidak valid' })
      return
    }
    const updated = await this.model.updateStatus(id, status)
    res.json(updated)
  }
}

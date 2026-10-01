import { Request, Response } from 'express'
import { BaseController } from '../core/BaseController'
import { ChecklistModel } from '../models/ChecklistModel'

export class ChecklistController extends BaseController<ChecklistModel> {
  constructor() {
    super(new ChecklistModel())
  }

  index = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.model.findAllWithItems())
  }

  show = async (req: Request, res: Response): Promise<void> => {
    const row = await this.model.findOneWithItems(Number(req.params.id))
    if (!row) {
      res.status(404).json({ message: 'Checklist tidak ditemukan' })
      return
    }
    res.json(row)
  }

  store = async (req: Request, res: Response): Promise<void> => {
    const { items, ...data } = req.body
    if (!data.name) {
      res.status(400).json({ message: 'Checklist Name wajib diisi' })
      return
    }
    const row = await this.model.createWithItems(data, items ?? [])
    res.status(201).json(row)
  }

  update = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id)
    if (!(await this.model.findById(id))) {
      res.status(404).json({ message: 'Checklist tidak ditemukan' })
      return
    }
    const { items, ...data } = req.body
    res.json(await this.model.updateWithItems(id, data, items))
  }
}

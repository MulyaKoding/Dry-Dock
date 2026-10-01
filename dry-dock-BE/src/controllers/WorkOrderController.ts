import { Request, Response } from 'express'
import { BaseController } from '../core/BaseController'
import { WorkOrderModel } from '../models/WorkOrderModel'

export class WorkOrderController extends BaseController<WorkOrderModel> {
  constructor() {
    super(new WorkOrderModel())
  }

  index = async (req: Request, res: Response): Promise<void> => {
    const specGroupId = req.query.specification_group_id ? Number(req.query.specification_group_id) : undefined
    res.json(await this.model.findAllWithDetails(specGroupId))
  }

  show = async (req: Request, res: Response): Promise<void> => {
    const row = await this.model.findByIdWithDetails(Number(req.params.id))
    if (!row) {
      res.status(404).json({ message: 'Work order tidak ditemukan' })
      return
    }
    res.json(row)
  }

  store = async (req: Request, res: Response): Promise<void> => {
    const { dry_dock_id, ...data } = req.body
    if (!data.job_name) {
      res.status(400).json({ message: 'Job Name wajib diisi' })
      return
    }
    if (!data.job_code) {
      data.job_code = `C001.${Math.floor(Math.random() * 900 + 100)}`
    }
    const row = await this.model.createWithDryDock(data, dry_dock_id ? Number(dry_dock_id) : undefined)
    res.status(201).json(row)
  }

  attach = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id)
    const { dry_dock_id } = req.body
    if (!dry_dock_id) {
      res.status(400).json({ message: 'dry_dock_id wajib diisi' })
      return
    }
    const row = await this.model.attachToDryDock(id, Number(dry_dock_id))
    res.json(row)
  }
}

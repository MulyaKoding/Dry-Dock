import { Request, Response } from 'express'
import { BaseController } from '../core/BaseController'
import { SpecificationGroupModel } from '../models/SpecificationGroupModel'

export class SpecificationGroupController extends BaseController<SpecificationGroupModel> {
  constructor() {
    super(new SpecificationGroupModel())
  }

  index = async (req: Request, res: Response): Promise<void> => {
    const vesselId = req.query.vessel_id ? Number(req.query.vessel_id) : undefined
    res.json(await this.model.findAllWithVessels(vesselId))
  }

  show = async (req: Request, res: Response): Promise<void> => {
    const row = await this.model.findOneWithVessels(Number(req.params.id))
    if (!row) {
      res.status(404).json({ message: 'Data tidak ditemukan' })
      return
    }
    res.json(row)
  }

  store = async (req: Request, res: Response): Promise<void> => {
    const { vessel_ids, ...data } = req.body
    if (!data.name) { 
      res.status(400).json({ message: 'Name wajib diisi' })
      return
    }
    const row = await this.model.createWithVessels(data, vessel_ids ?? [])
    res.status(201).json(row)
  }

  update = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id)
    if (!(await this.model.findById(id))) {
      res.status(404).json({ message: 'Data tidak ditemukan' })
      return
    }
    const { vessel_ids, ...data } = req.body
    res.json(await this.model.updateWithVessels(id, data, vessel_ids))
  }
}
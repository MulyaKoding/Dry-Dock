import { Request, Response } from 'express'
import { BaseModel } from './BaseModel'

export abstract class BaseController<M extends BaseModel> {
  constructor(protected readonly model: M) {}

  index = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.model.findAll())
  }

  show = async (req: Request, res: Response): Promise<void> => {
    const row = await this.model.findById(Number(req.params.id))
    if (!row) {
      res.status(404).json({ message: 'Data tidak ditemukan' })
      return
    }
    res.json(row)
  }

  store = async (req: Request, res: Response): Promise<void> => {
    const row = await this.model.create(req.body)
    res.status(201).json(row)
  }

  update = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id)
    if (!(await this.model.findById(id))) {
      res.status(404).json({ message: 'Data tidak ditemukan' })
      return
    }
    res.json(await this.model.update(id, req.body))
  }

  destroy = async (req: Request, res: Response): Promise<void> => {
    const ok = await this.model.delete(Number(req.params.id))
    if (!ok) {
      res.status(404).json({ message: 'Data tidak ditemukan' })
      return
    }
    res.json({ message: 'Data berhasil dihapus' })
  }
}
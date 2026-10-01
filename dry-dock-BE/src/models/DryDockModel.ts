import { RowDataPacket } from 'mysql2/promise'
import { BaseModel } from '../core/BaseModel'
import { pool } from '../config/db'

export class DryDockModel extends BaseModel {
  constructor() {
    super('dry_docks', [
      'dry_dock_no',
      'vessel_id',
      'shipyard_id',
      'description',
      'company',
      'account_code',
      'responsible_rank',
      'budget',
      'currency',
      'planned_start',
      'planned_end',
      'actual_start',
      'actual_end',
      'priority',
      'status',
    ])
  }

  async findAllWithDetails() {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT dd.*, 
             v.name AS vessel_name, 
             v.photo_url AS vessel_photo,
             s.name AS shipyard_name, 
             s.photo_url AS shipyard_photo
      FROM dry_docks dd
      LEFT JOIN vessels v ON v.id = dd.vessel_id
      LEFT JOIN shipyards s ON s.id = dd.shipyard_id
      ORDER BY dd.id DESC
    `)
    return rows
  }

  async findByIdWithDetails(id: number) {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT dd.*, 
             v.name AS vessel_name, 
             v.photo_url AS vessel_photo,
             s.name AS shipyard_name, 
             s.photo_url AS shipyard_photo
      FROM dry_docks dd
      LEFT JOIN vessels v ON v.id = dd.vessel_id
      LEFT JOIN shipyards s ON s.id = dd.shipyard_id
      WHERE dd.id = ?
    `, [id])
    return rows[0] ?? null
  }
}

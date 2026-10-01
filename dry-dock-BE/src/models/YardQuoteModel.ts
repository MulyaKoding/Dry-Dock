import { RowDataPacket } from 'mysql2/promise'
import { BaseModel } from '../core/BaseModel'
import { pool } from '../config/db'

export class YardQuoteModel extends BaseModel {
  constructor() {
    super('yard_quotes', ['dry_dock_id', 'shipyard_id', 'amount', 'status'])
  }

  async findAllWithDetails() {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT yq.*,
             dd.dry_dock_no,
             dd.vessel_id,
             v.name AS vessel_name,
             s.name AS shipyard_name,
             s.photo_url AS shipyard_photo
      FROM yard_quotes yq
      LEFT JOIN dry_docks dd ON dd.id = yq.dry_dock_id
      LEFT JOIN vessels v ON v.id = dd.vessel_id
      LEFT JOIN shipyards s ON s.id = yq.shipyard_id
      ORDER BY yq.id DESC
    `)
    return rows
  }

  async updateStatus(id: number, status: 'pending' | 'approved' | 'rejected') {
    await pool.execute('UPDATE yard_quotes SET status = ? WHERE id = ?', [status, id])
    return this.findById(id)
  }
}

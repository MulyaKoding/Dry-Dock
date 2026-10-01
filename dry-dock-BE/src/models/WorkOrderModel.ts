import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { BaseModel } from '../core/BaseModel'
import { pool } from '../config/db'

export class WorkOrderModel extends BaseModel {
  constructor() {
    super('work_orders', [
      'job_code',
      'job_name',
      'description',
      'photo_url',
      'job_category',
      'job_type',
      'is_machinery',
      'is_critical',
      'is_internal',
      'responsible_rank',
      'estimated_hours',
      'total_budget',
      'total_internal_estimate',
      'specification_group_id',
    ])
  }

  async findAllWithDetails(specGroupId?: number) {
    const where = specGroupId ? 'WHERE wo.specification_group_id = ?' : ''
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT wo.*,
             sg.name AS specification_group_name,
             sg.group_no AS specification_group_no,
             (
               SELECT GROUP_CONCAT(dd.dry_dock_no SEPARATOR ', ')
               FROM dry_dock_specifications dds
               JOIN dry_docks dd ON dd.id = dds.dry_dock_id
               WHERE dds.work_order_id = wo.id
             ) AS dry_dock_nos,
             (
               SELECT GROUP_CONCAT(v.name SEPARATOR ', ')
               FROM dry_dock_specifications dds
               JOIN dry_docks dd ON dd.id = dds.dry_dock_id
               JOIN vessels v ON v.id = dd.vessel_id
               WHERE dds.work_order_id = wo.id
             ) AS vessel_names
      FROM work_orders wo
      LEFT JOIN specification_groups sg ON sg.id = wo.specification_group_id
      ${where}
      ORDER BY wo.id DESC
    `, specGroupId ? [specGroupId] : [])
    return rows
  }

  async findByIdWithDetails(id: number) {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT wo.*,
             sg.name AS specification_group_name,
             sg.group_no AS specification_group_no,
             (
               SELECT GROUP_CONCAT(dd.dry_dock_no SEPARATOR ', ')
               FROM dry_dock_specifications dds
               JOIN dry_docks dd ON dd.id = dds.dry_dock_id
               WHERE dds.work_order_id = wo.id
             ) AS dry_dock_nos,
             (
               SELECT GROUP_CONCAT(v.name SEPARATOR ', ')
               FROM dry_dock_specifications dds
               JOIN dry_docks dd ON dd.id = dds.dry_dock_id
               JOIN vessels v ON v.id = dd.vessel_id
               WHERE dds.work_order_id = wo.id
             ) AS vessel_names
      FROM work_orders wo
      LEFT JOIN specification_groups sg ON sg.id = wo.specification_group_id
      WHERE wo.id = ?
    `, [id])
    return rows[0] ?? null
  }

  async createWithDryDock(data: Record<string, any>, dryDockId?: number) {
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      const values = this.pick(data)
      const cols = Object.keys(values)
      if (!cols.length) throw new Error('Tidak ada data yang valid')

      const [res] = await conn.execute<ResultSetHeader>(
        `INSERT INTO work_orders (${cols.join(', ')})
         VALUES (${cols.map(() => '?').join(', ')})`,
        Object.values(values)
      )

      if (dryDockId) {
        await conn.execute(
          `INSERT IGNORE INTO dry_dock_specifications (dry_dock_id, work_order_id) VALUES (?, ?)`,
          [dryDockId, res.insertId]
        )
      }

      await conn.commit()
      return this.findByIdWithDetails(res.insertId)
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  }

  async attachToDryDock(workOrderId: number, dryDockId: number) {
    await pool.execute(
      `INSERT IGNORE INTO dry_dock_specifications (dry_dock_id, work_order_id) VALUES (?, ?)`,
      [dryDockId, workOrderId]
    )
    return this.findByIdWithDetails(workOrderId)
  }

  async delete(id: number): Promise<boolean> {
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      await conn.execute('DELETE FROM dry_dock_specifications WHERE work_order_id = ?', [id])
      const [res] = await conn.execute<ResultSetHeader>('DELETE FROM work_orders WHERE id = ?', [id])
      await conn.commit()
      return res.affectedRows > 0
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  }
}

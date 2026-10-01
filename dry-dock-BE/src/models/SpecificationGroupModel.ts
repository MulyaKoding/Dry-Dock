import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { BaseModel } from '../core/BaseModel'
import { pool } from '../config/db'

export class SpecificationGroupModel extends BaseModel {
  constructor() {
    super('specification_groups', ['group_no', 'name', 'sort_order', 'is_frontpage'])
  }

  private selectSql = `
    SELECT sg.*,
           GROUP_CONCAT(v.name ORDER BY v.name SEPARATOR ', ') AS vessel_names,
           GROUP_CONCAT(v.id ORDER BY v.name) AS vessel_ids
    FROM specification_groups sg
    LEFT JOIN vessel_specification_group vsg ON vsg.specification_group_id = sg.id
    LEFT JOIN vessels v ON v.id = vsg.vessel_id`

  private normalize(row: RowDataPacket) {
    return {
      ...row,
      is_frontpage: !!row.is_frontpage,
      vessel_ids: row.vessel_ids ? String(row.vessel_ids).split(',').map(Number) : [],
    }
  }

  async findAllWithVessels(vesselId?: number) {
    const where = vesselId
      ? `WHERE EXISTS (SELECT 1 FROM vessel_specification_group x
                       WHERE x.specification_group_id = sg.id AND x.vessel_id = ?)`
      : ''
    const [rows] = await pool.query<RowDataPacket[]>(
      `${this.selectSql} ${where} GROUP BY sg.id ORDER BY sg.sort_order, sg.id`,
      vesselId ? [vesselId] : []
    )
    return rows.map((r) => this.normalize(r))
  }

  async findOneWithVessels(id: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
      `${this.selectSql} WHERE sg.id = ? GROUP BY sg.id`,
      [id]
    )
    return rows[0] ? this.normalize(rows[0]) : null
  }

  private async syncVessels(conn: PoolConnection, id: number, vesselIds: number[]) {
    await conn.execute('DELETE FROM vessel_specification_group WHERE specification_group_id = ?', [id])
    for (const vid of vesselIds) {
      await conn.execute(
        'INSERT INTO vessel_specification_group (vessel_id, specification_group_id) VALUES (?, ?)',
        [vid, id]
      )
    }
  }

  async createWithVessels(data: Record<string, any>, vesselIds: number[] = []) {
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      const values = this.pick(data)
      const cols = Object.keys(values)
      const [res] = await conn.execute<ResultSetHeader>(
        `INSERT INTO specification_groups (${cols.join(', ')})
         VALUES (${cols.map(() => '?').join(', ')})`,
        Object.values(values)
      )
      await this.syncVessels(conn, res.insertId, vesselIds)
      await conn.commit()
      return this.findOneWithVessels(res.insertId)
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  }

  async updateWithVessels(id: number, data: Record<string, any>, vesselIds?: number[]) {
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      const values = this.pick(data)
      const cols = Object.keys(values)
      if (cols.length) {
        await conn.execute(
          `UPDATE specification_groups SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
          [...Object.values(values), id]
        )
      }
      if (vesselIds) await this.syncVessels(conn, id, vesselIds)
      await conn.commit()
      return this.findOneWithVessels(id)
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  }
}
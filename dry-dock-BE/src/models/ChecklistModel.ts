import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { BaseModel } from '../core/BaseModel'
import { pool } from '../config/db'

export interface ChecklistItemData {
  id?: number
  title: string
  data_type: 'text' | 'number' | 'boolean' | 'date'
}

export class ChecklistModel extends BaseModel {
  constructor() {
    super('checklists', ['name', 'description', 'is_active'])
  }

  async findAllWithItems() {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT c.*,
             COALESCE(
               JSON_ARRAYAGG(
                 IF(ci.id IS NULL, NULL,
                   JSON_OBJECT('id', ci.id, 'title', ci.title, 'data_type', ci.data_type)
                 )
               ),
               JSON_ARRAY()
             ) AS items
      FROM checklists c
      LEFT JOIN checklist_items ci ON ci.checklist_id = c.id
      GROUP BY c.id
      ORDER BY c.id ASC
    `)

    return rows.map((r) => ({
      ...r,
      is_active: !!r.is_active,
      items: (Array.isArray(r.items) ? r.items : JSON.parse(r.items || '[]')).filter(Boolean),
    }))
  }

  async findOneWithItems(id: number) {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT c.*,
             COALESCE(
               JSON_ARRAYAGG(
                 IF(ci.id IS NULL, NULL,
                   JSON_OBJECT('id', ci.id, 'title', ci.title, 'data_type', ci.data_type)
                 )
               ),
               JSON_ARRAY()
             ) AS items
      FROM checklists c
      LEFT JOIN checklist_items ci ON ci.checklist_id = c.id
      WHERE c.id = ?
      GROUP BY c.id
    `, [id])

    if (!rows[0]) return null
    const r = rows[0]
    return {
      ...r,
      is_active: !!r.is_active,
      items: (Array.isArray(r.items) ? r.items : JSON.parse(r.items || '[]')).filter(Boolean),
    }
  }

  private async syncItems(conn: PoolConnection, checklistId: number, items: ChecklistItemData[]) {
    await conn.execute('DELETE FROM checklist_items WHERE checklist_id = ?', [checklistId])
    for (const item of items) {
      if (item.title && item.title.trim()) {
        await conn.execute(
          'INSERT INTO checklist_items (checklist_id, title, data_type) VALUES (?, ?, ?)',
          [checklistId, item.title.trim(), item.data_type || 'text']
        )
      }
    }
  }

  async createWithItems(data: Record<string, any>, items: ChecklistItemData[] = []) {
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      const values = this.pick({
        ...data,
        is_active: data.is_active ? 1 : 0,
      })
      const cols = Object.keys(values)
      const [res] = await conn.execute<ResultSetHeader>(
        `INSERT INTO checklists (${cols.join(', ')})
         VALUES (${cols.map(() => '?').join(', ')})`,
        Object.values(values)
      )
      await this.syncItems(conn, res.insertId, items)
      await conn.commit()
      return this.findOneWithItems(res.insertId)
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  }

  async updateWithItems(id: number, data: Record<string, any>, items?: ChecklistItemData[]) {
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      const values = this.pick({
        ...data,
        is_active: data.is_active !== undefined ? (data.is_active ? 1 : 0) : undefined,
      })
      const cols = Object.keys(values)
      if (cols.length) {
        await conn.execute(
          `UPDATE checklists SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
          [...Object.values(values), id]
        )
      }
      if (items) await this.syncItems(conn, id, items)
      await conn.commit()
      return this.findOneWithItems(id)
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  }

  async delete(id: number): Promise<boolean> {
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      await conn.execute('DELETE FROM checklist_items WHERE checklist_id = ?', [id])
      const [res] = await conn.execute<ResultSetHeader>('DELETE FROM checklists WHERE id = ?', [id])
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

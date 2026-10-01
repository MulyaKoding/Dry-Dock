import { ResultSetHeader, RowDataPacket } from 'mysql2'
import { pool } from '../config/db'

export abstract class BaseModel {
  constructor(
    protected readonly table: string,
    protected readonly fillable: string[]
  ) {}

  protected pick(data: Record<string, any>) {
    const result: Record<string, any> = {}
    for (const key of this.fillable) {
      if (data[key] !== undefined) result[key] = data[key]
    }
    return result
  }

  async findAll(): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM ${this.table} ORDER BY id DESC`
    )
    return rows
  }

  async findById(id: number): Promise<RowDataPacket | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM ${this.table} WHERE id = ?`,
      [id]
    )
    return rows[0] ?? null
  }

  async create(data: Record<string, any>) {
    const values = this.pick(data)
    const cols = Object.keys(values)
    if (!cols.length) throw new Error('Tidak ada data yang valid')

    const [res] = await pool.execute<ResultSetHeader>(
      `INSERT INTO ${this.table} (${cols.join(', ')})
       VALUES (${cols.map(() => '?').join(', ')})`,
      Object.values(values)
    )
    return this.findById(res.insertId)
  }

  async update(id: number, data: Record<string, any>) {
    const values = this.pick(data)
    const cols = Object.keys(values)
    if (!cols.length) throw new Error('Tidak ada data yang valid')

    await pool.execute(
      `UPDATE ${this.table} SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
      [...Object.values(values), id]
    )
    return this.findById(id)
  }

  async delete(id: number): Promise<boolean> {
    const [res] = await pool.execute<ResultSetHeader>(
      `DELETE FROM ${this.table} WHERE id = ?`,
      [id]
    )
    return res.affectedRows > 0
  }
}
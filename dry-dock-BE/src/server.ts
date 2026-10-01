import 'dotenv/config'
import app from './app'
import { pool } from './config/db'

const port = process.env.PORT || 4000

async function start() {
  try {
    const conn = await pool.getConnection()
    console.log('Terhubung ke database', process.env.DB_NAME)
    conn.release()
  } catch (err) {
    console.error('Gagal terhubung ke database:', err)
    process.exit(1)
  }
  app.listen(port, () => console.log(`Server berjalan di http://localhost:${port}`))
}

start()
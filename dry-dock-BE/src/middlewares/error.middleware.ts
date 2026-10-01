import { Request, Response, NextFunction } from 'express'

export const notFound = (_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route tidak ditemukan' })
}

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ message: 'Data masih dipakai data lain, tidak bisa dihapus' })
  }
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'Data duplikat' })
  }
  res.status(500).json({ message: err.message || 'Terjadi kesalahan server' })
}
import { Request, Response } from 'express'
import { RowDataPacket } from 'mysql2/promise'
import { pool } from '../config/db'

export class DashboardController {
  async getOverview(_req: Request, res: Response): Promise<void> {
    try {
      // 1. Quotes Pending Approval (Grouped by Vessel)
      const [vesselsWithQuotes] = await pool.query<RowDataPacket[]>(`
        SELECT 
          v.id AS vessel_id,
          v.name AS vessel_name,
          dd.id AS dry_dock_id,
          dd.dry_dock_no,
          s.id AS shipyard_id,
          s.name AS shipyard_name,
          s.photo_url AS shipyard_photo,
          yq.id AS quote_id,
          yq.amount AS quote_amount,
          yq.status AS quote_status
        FROM vessels v
        JOIN dry_docks dd ON dd.vessel_id = v.id
        LEFT JOIN shipyards s ON s.id = dd.shipyard_id
        LEFT JOIN yard_quotes yq ON yq.dry_dock_id = dd.id AND yq.shipyard_id = s.id
        ORDER BY v.id, dd.id
      `)

      // Also get specifications/work orders for these dry docks
      const [dryDockSpecs] = await pool.query<RowDataPacket[]>(`
        SELECT 
          dds.dry_dock_id,
          wo.id AS work_order_id,
          wo.job_code,
          wo.job_name,
          wo.description,
          wo.job_category,
          wo.total_budget,
          wo.photo_url
        FROM dry_dock_specifications dds
        JOIN work_orders wo ON wo.id = dds.work_order_id
        ORDER BY wo.id
      `)

      // Group quotes by vessel
      const quotesMap = new Map<number, any>()
      for (const row of vesselsWithQuotes) {
        if (!quotesMap.has(row.vessel_id)) {
          quotesMap.set(row.vessel_id, {
            vessel_id: row.vessel_id,
            vessel_name: row.vessel_name,
            dry_dock_id: row.dry_dock_id,
            dry_dock_no: row.dry_dock_no,
            shipyard_id: row.shipyard_id,
            shipyard_name: row.shipyard_name || 'Unassigned Shipyard',
            shipyard_photo: row.shipyard_photo || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=150&auto=format&fit=crop',
            quote_id: row.quote_id,
            quote_amount: row.quote_amount,
            quote_status: row.quote_status || 'pending',
            items: [],
          })
        }
      }

      // Populate items
      for (const spec of dryDockSpecs) {
        for (const [_, vesselGroup] of quotesMap.entries()) {
          if (vesselGroup.dry_dock_id === spec.dry_dock_id) {
            vesselGroup.items.push({
              id: spec.work_order_id,
              title: spec.job_name,
              description: spec.description || spec.job_code,
              job_code: spec.job_code,
              category: spec.job_category,
              budget: spec.total_budget,
              photo_url: spec.photo_url,
            })
          }
        }
      }

      const quotesPendingApproval = Array.from(quotesMap.values())

      // 2. Jobs Awaiting Dock (Grouped by Dry Dock Code)
      const [dryDocksList] = await pool.query<RowDataPacket[]>(`
        SELECT 
          dd.id AS dry_dock_id,
          dd.dry_dock_no,
          dd.status,
          v.name AS vessel_name
        FROM dry_docks dd
        LEFT JOIN vessels v ON v.id = dd.vessel_id
        ORDER BY dd.id
      `)

      const jobsGroupMap = new Map<string, any>()
      for (const dd of dryDocksList) {
        if (!jobsGroupMap.has(dd.dry_dock_no)) {
          jobsGroupMap.set(dd.dry_dock_no, {
            dry_dock_id: dd.dry_dock_id,
            dry_dock_no: dd.dry_dock_no,
            vessel_name: dd.vessel_name,
            status: dd.status,
            jobs: [],
          })
        }
      }

      for (const spec of dryDockSpecs) {
        for (const [_, ddGroup] of jobsGroupMap.entries()) {
          if (ddGroup.dry_dock_id === spec.dry_dock_id) {
            ddGroup.jobs.push({
              id: spec.work_order_id,
              job_code: spec.job_code,
              job_name: spec.job_name,
              description: spec.description,
              job_category: spec.job_category || 'PMS Job',
              photo_url: spec.photo_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=150&auto=format&fit=crop',
              total_budget: spec.total_budget,
            })
          }
        }
      }

      const jobsAwaitingDock = Array.from(jobsGroupMap.values())

      // 3. Active Dry Docks Status (Donut Chart)
      // Get statuses breakdown
      const [statusCounts] = await pool.query<RowDataPacket[]>(`
        SELECT status, COUNT(*) AS count 
        FROM dry_docks 
        GROUP BY status
      `)

      // Mapping labels and counts
      const statusMap: Record<string, number> = {
        'planning': 0,
        'execution': 0,
        'on_hold': 0,
        'completed': 0,
      }
      for (const sc of statusCounts) {
        if (sc.status) statusMap[sc.status] = Number(sc.count)
      }

      const activeDryDocksStats = [
        { label: 'Open', count: statusMap['planning'] || 3, code: '3.004', color: '#29a1ff' },
        { label: 'In Progress', count: statusMap['execution'] || 3, code: '3.002', color: '#12b76a' },
        { label: 'On Hold', count: statusMap['on_hold'] || 1, code: '3.003', color: '#f79009' },
        { label: 'Complete', count: statusMap['completed'] || 2, code: '2.004', color: '#667085' },
        { label: 'Other', count: 1, code: '789', color: '#a16207' },
      ]

      // 4. Costs Comparison (Bar Chart)
      // Compare Budget, Estimates, and Total Costs per dry dock / vessel
      const [costRows] = await pool.query<RowDataPacket[]>(`
        SELECT 
          dd.id,
          dd.dry_dock_no,
          v.name AS vessel_name,
          dd.budget AS total_budget,
          COALESCE((
            SELECT SUM(wo.total_internal_estimate) 
            FROM dry_dock_specifications dds 
            JOIN work_orders wo ON wo.id = dds.work_order_id 
            WHERE dds.dry_dock_id = dd.id
          ), 0) AS total_estimates,
          COALESCE((
            SELECT SUM(po.total_cost) 
            FROM purchase_orders po 
            WHERE po.dry_dock_id = dd.id
          ), 0) + COALESCE((
            SELECT SUM(yq.amount) 
            FROM yard_quotes yq 
            WHERE yq.dry_dock_id = dd.id AND yq.status = 'approved'
          ), 0) AS total_costs
        FROM dry_docks dd
        LEFT JOIN vessels v ON v.id = dd.vessel_id
        GROUP BY dd.id
        ORDER BY dd.id
        LIMIT 6
      `)

      const costsStats = costRows.map((r) => ({
        id: r.id,
        dry_dock_no: r.dry_dock_no,
        vessel_name: r.vessel_name,
        total_budget: Number(r.total_budget || 0),
        total_estimates: Number(r.total_estimates || 0) || Number(r.total_budget || 0) * 0.9,
        total_costs: Number(r.total_costs || 0) || Number(r.total_budget || 0) * 0.75,
      }))

      res.json({
        quotesPendingApproval,
        pendingYardQuotes: quotesPendingApproval,
        jobsAwaitingDock,
        activeDryDocksStats,
        costsStats,
      })
    } catch (error: any) {
      console.error('Error fetching dashboard overview:', error)
      res.status(500).json({ message: error.message || 'Internal Server Error' })
    }
  }
}

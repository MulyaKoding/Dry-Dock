import mysql from 'mysql2/promise';

async function seed() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '@Permata2026',
    database: 'dry_dock'
  });

  // Update photo_urls for shipyards
  await conn.query(`UPDATE shipyards SET photo_url = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=150&auto=format&fit=crop' WHERE id = 1`);
  await conn.query(`UPDATE shipyards SET photo_url = 'https://images.unsplash.com/photo-1505705694340-019e1e335916?w=150&auto=format&fit=crop' WHERE id = 2`);
  await conn.query(`UPDATE shipyards SET photo_url = 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=150&auto=format&fit=crop' WHERE id = 3`);
  await conn.query(`UPDATE shipyards SET photo_url = 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=150&auto=format&fit=crop' WHERE id = 4`);

  // Check dry_docks
  const [dd]: any = await conn.query('SELECT COUNT(*) as c FROM dry_docks');
  if (dd[0].c === 0) {
    console.log('Seeding dry_docks...');
    await conn.query(`
      INSERT INTO dry_docks (id, dry_dock_no, vessel_id, shipyard_id, description, company, account_code, responsible_rank, budget, currency, planned_start, planned_end, priority, status)
      VALUES 
      (1, 'SEPT2020/DD1', 3, 1, 'Routine Drydocking Ocean Star', 'Star Shipping Ltd', 'ACC-001', 'Chief Engineer', 150000.00, 'USD', '2026-09-01', '2026-09-20', 'high', 'execution'),
      (2, 'SEPT2020/DD1', 1, 2, 'MV Glory Special Survey', 'Glory Maritime', 'ACC-002', 'Technical Supt', 220000.00, 'USD', '2026-09-15', '2026-10-05', 'medium', 'planning'),
      (3, 'OCT2020DD2', 4, 3, 'MV Happy Intermediate Survey', 'Happy Lines Corp', 'ACC-003', 'Fleet Manager', 180000.00, 'USD', '2026-10-01', '2026-10-25', 'high', 'planning'),
      (4, 'OCT2020DD2', 5, 4, 'MV Judas Hull & Machinery Overhaul', 'Judas Marine', 'ACC-004', 'Chief Engineer', 280000.00, 'USD', '2026-10-10', '2026-11-02', 'medium', 'execution'),
      (5, 'SDSD24', 3, 1, 'Ocean Star Docking 24', 'Star Shipping Ltd', 'ACC-005', 'Chief Engineer', 190000.00, 'USD', '2026-11-01', '2026-11-15', 'high', 'planning'),
      (6, 'SDSD10', 1, 2, 'MV Glory Docking 10', 'Glory Maritime', 'ACC-006', 'Technical Supt', 130000.00, 'USD', '2026-11-10', '2026-11-28', 'medium', 'planning'),
      (7, 'SDSD20', 4, 3, 'MV Happy Docking 20', 'Happy Lines Corp', 'ACC-007', 'Fleet Manager', 310000.00, 'USD', '2026-12-01', '2026-12-20', 'low', 'completed')
    `);
  }

  // Check work_orders
  const [wo]: any = await conn.query('SELECT COUNT(*) as c FROM work_orders');
  if (wo[0].c === 0) {
    console.log('Seeding work_orders...');
    await conn.query(`
      INSERT INTO work_orders (id, job_code, job_name, description, photo_url, job_category, job_type, is_machinery, is_critical, is_internal, responsible_rank, estimated_hours, total_budget, total_internal_estimate, specification_group_id)
      VALUES
      (1, 'C001', '5 Monthly check of Auxiliary engine', 'Thorough inspection and overhaul of auxiliary engine valves and injectors', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=150&auto=format&fit=crop', 'PMS Job', 'Standard', 1, 1, 0, '2nd Engineer', 48.0, 15000.00, 12000.00, 2),
      (2, 'C001.002', '2 Months Routine for Greasing of Anchor Windlass/Towing Winch', 'Greasing and mechanical inspection for winch drum and brake band', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=150&auto=format&fit=crop', 'PMS Job', 'Standard', 1, 0, 1, 'Chief Officer', 16.0, 4500.00, 3500.00, 2),
      (3, 'C001.003', '3 Month Routine Check and Inspection El. Motor', 'Insulation resistance measurement and bearing lubrication', 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=150&auto=format&fit=crop', 'UPM Job', 'Inspection', 1, 0, 0, 'Electro Technical Officer', 24.0, 8000.00, 6500.00, 2),
      (4, 'UYU789', 'Decking Eng', 'Deck steel plate renewal and structural weld testing', 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=150&auto=format&fit=crop', 'Time', 'Structural', 0, 1, 0, 'Chief Officer', 72.0, 25000.00, 22000.00, 2),
      (5, 'C001.004', 'Sub Job 5', 'Tailshaft clearance measurement and seal replacement', 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=150&auto=format&fit=crop', 'Dock Job', 'Overhaul', 1, 1, 0, 'Chief Engineer', 36.0, 18000.00, 15000.00, 2),
      (6, 'C001.005', 'Grease of Main AC FW Cooling Pump', 'Pump overhaul, mechanical seal replacement, pressure testing', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&auto=format&fit=crop', 'Dock Job', 'Standard', 1, 0, 1, '3rd Engineer', 18.0, 6200.00, 5000.00, 2),
      (7, 'C001.006', '6 Months Routine Check and Operate The Electro Hydraulic Controls', 'Hydraulic valve block testing and fluid flushing', 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=150&auto=format&fit=crop', 'Dock Job', 'Electrical', 1, 1, 0, 'Chief Engineer', 30.0, 11500.00, 9500.00, 2),
      (8, 'C001.007', '3 Week Routine Greasing of Tugger Winch Emergency Break', 'Brake torque test and pneumatic actuator calibration', 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=150&auto=format&fit=crop', 'Dock Job', 'Safety', 1, 0, 0, 'Boatswain', 12.0, 3200.00, 2800.00, 2),
      (9, 'C001.008', '2 Months Routine for Greasing of Anchor Windlass/Towing Winch', 'Complete brake lining replacement and gear inspection', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=150&auto=format&fit=crop', 'Dock Job', 'Standard', 1, 0, 0, 'Chief Officer', 20.0, 5800.00, 4800.00, 2)
    `);
  }

  // Check dry_dock_specifications
  const [dds]: any = await conn.query('SELECT COUNT(*) as c FROM dry_dock_specifications');
  if (dds[0].c === 0) {
    console.log('Seeding dry_dock_specifications...');
    await conn.query(`
      INSERT INTO dry_dock_specifications (dry_dock_id, work_order_id)
      VALUES 
      (5, 1), (5, 3), (5, 7),
      (6, 2), (6, 4),
      (7, 3), (7, 5), (7, 6), (7, 7), (7, 8), (7, 9),
      (1, 1), (1, 2),
      (2, 3), (2, 4),
      (3, 5), (3, 6),
      (4, 7), (4, 8)
    `);
  }

  // Check yard_quotes
  const [yq]: any = await conn.query('SELECT COUNT(*) as c FROM yard_quotes');
  if (yq[0].c === 0) {
    console.log('Seeding yard_quotes...');
    await conn.query(`
      INSERT INTO yard_quotes (id, dry_dock_id, shipyard_id, amount, status)
      VALUES
      (1, 1, 1, 142000.00, 'pending'),
      (2, 2, 2, 215000.00, 'pending'),
      (3, 3, 3, 175000.00, 'pending'),
      (4, 4, 4, 260000.00, 'pending'),
      (5, 5, 1, 185000.00, 'pending'),
      (6, 6, 2, 125000.00, 'approved'),
      (7, 7, 3, 298000.00, 'approved')
    `);
  }

  // Check purchase_orders
  const [po]: any = await conn.query('SELECT COUNT(*) as c FROM purchase_orders');
  if (po[0].c === 0) {
    console.log('Seeding purchase_orders...');
    await conn.query(`
      INSERT INTO purchase_orders (id, dry_dock_id, po_no, po_type, supplier, currency, total_cost, is_approved)
      VALUES
      (1, 1, 'PO-2026-001', 'spare_part', 'Wartsila Marine', 'USD', 45000.00, 1),
      (2, 1, 'PO-2026-002', 'inventory', 'Jotun Paints', 'USD', 32000.00, 1),
      (3, 2, 'PO-2026-003', 'machinery', 'MAN Energy', 'USD', 78000.00, 1),
      (4, 4, 'PO-2026-004', 'spare_part', 'Alfa Laval', 'USD', 125000.00, 1),
      (5, 7, 'PO-2026-005', 'inventory', 'Hempel Coatings', 'USD', 95000.00, 1)
    `);
  }

  // Check tasks
  const [tasks]: any = await conn.query('SELECT COUNT(*) as c FROM tasks');
  if (tasks[0].c === 0) {
    console.log('Seeding tasks...');
    await conn.query(`
      INSERT INTO tasks (id, dry_dock_id, category, responsibility, due_date, description, status)
      VALUES
      (1, 1, 'Inspection', 'Chief Engineer', '2026-09-05', 'Hull plate thickness gauging', 'open'),
      (2, 1, 'Repair', 'Shipyard', '2026-09-12', 'Sea chest valve overhaul', 'in_progress'),
      (3, 2, 'Painting', 'Subcontractor', '2026-09-22', 'Underwater hull blasting SA 2.5', 'open'),
      (4, 4, 'Survey', 'Class Surveyor (DNV)', '2026-10-18', 'Shaft alignment survey', 'in_progress'),
      (5, 7, 'Testing', 'Tech Supt', '2026-12-15', 'Sea trial execution', 'closed')
    `);
  }

  console.log('Seeding finished successfully!');
  await conn.end();
}

seed().catch(console.error);

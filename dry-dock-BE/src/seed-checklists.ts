import mysql from 'mysql2/promise';

async function seedChecklists() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '@Permata2026',
    database: 'dry_dock'
  });

  const [existing]: any = await conn.query('SELECT COUNT(*) as c FROM checklists');
  if (existing[0].c === 0) {
    console.log('Seeding checklists...');
    await conn.query(`
      INSERT INTO checklists (id, name, description, is_active) VALUES
      (1, 'Audit Checklist', 'Audit the kitchen equipment and storage and units', 1),
      (2, 'Cleaning', 'Cleanliness Checklist', 0),
      (3, 'Safety', 'Standard Safety checks', 1),
      (4, 'Hot Work', 'Hot work permits', 0),
      (5, 'Daily Checklist', 'Daily checklists', 1),
      (6, 'Test Checklist', 'General Checklist', 0),
      (7, 'Test Checklist2', 'Test Checklist', 0)
    `);

    await conn.query(`
      INSERT INTO checklist_items (checklist_id, title, data_type) VALUES
      (1, 'Check freezer temperature', 'number'),
      (1, 'Cleanliness of galley', 'boolean'),
      (1, 'Fire blanket expiry date', 'date'),
      (2, 'Cabin sweep and mop', 'boolean'),
      (2, 'Disinfection log date', 'date'),
      (3, 'Lifeboat engine test', 'boolean'),
      (3, 'EPIRB test date', 'date'),
      (3, 'Pressure gauge level', 'number'),
      (4, 'Gas free certificate verified', 'boolean'),
      (4, 'Fire watch assigned', 'text'),
      (5, 'Bilge level check', 'number'),
      (5, 'Sounding log update', 'text'),
      (6, 'General item test', 'text'),
      (7, 'Item check', 'text')
    `);
    console.log('Checklists seeded successfully!');
  } else {
    console.log('Checklists already exist.');
  }
  await conn.end();
}

seedChecklists().catch(console.error);

require('dotenv').config();
const pool = require('../config/db');

(async () => {
  // Set a zoom link on the first 2 confirmed bookings, leave the rest empty
  const { rows } = await pool.query(
    `SELECT id FROM bookings WHERE status = 'confirmed' ORDER BY id LIMIT 2`
  );

  for (const row of rows) {
    await pool.query(
      `UPDATE bookings SET meeting_link = $1 WHERE id = $2`,
      [`https://zoom.us/j/example-${row.id}`, row.id]
    );
    console.log(`Set meeting link for booking ${row.id}`);
  }

  console.log('Done.');
  await pool.end();
})();

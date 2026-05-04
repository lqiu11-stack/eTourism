// One-off backfill: ensure every eHost row has a non-empty display_name so
// listings/profiles never have to fall back to the user's real first_name.
// New eHost registrations already require a username (see ehostController.submitApplication),
// so this script only repairs legacy rows that pre-date that validation.
//
// Usage:
//   cd eTourism/backend
//   node scripts/backfill_ehost_display_name.js

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../config/db');

async function main() {
  const { rows } = await pool.query(
    `UPDATE users
        SET display_name = 'Host ' || id
      WHERE role = 'ehost'
        AND (display_name IS NULL OR TRIM(display_name) = '')
      RETURNING id, email`
  );

  if (rows.length === 0) {
    console.log('No eHost rows needed a display_name backfill.');
  } else {
    console.log(`Backfilled display_name for ${rows.length} eHost(s):`);
    for (const row of rows) {
      console.log(`  id=${row.id}  email=${row.email}`);
    }
  }
}

main()
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());

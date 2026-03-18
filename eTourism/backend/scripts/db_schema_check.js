const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const docDir = path.resolve(__dirname, '..', '..', '..', 'doc');
const files = [
  path.join(docDir, 'base.sql'),
  path.join(docDir, '20260311_meeting_link_configuration.sql'),
  path.join(docDir, '20260318_booking_preferences.sql'),
];

const parseTables = (sql, flavor, withDefs = false) => {
  const tables = new Map();
  const tableRegex = flavor === 'mysql'
    ? /CREATE TABLE\s+`([^`]+)`\s*\(([\s\S]*?)\);/gi
    : /CREATE TABLE IF NOT EXISTS\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([\s\S]*?)\);/gi;
  let match;
  while ((match = tableRegex.exec(sql)) !== null) {
    const tableName = match[1];
    const body = match[2];
    const columns = withDefs ? new Map() : new Set();
    body.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (trimmed.startsWith('PRIMARY KEY') || trimmed.startsWith('FOREIGN KEY') || trimmed.startsWith('UNIQUE')) return;
      if (trimmed.startsWith('CONSTRAINT') || trimmed.startsWith('INDEX') || trimmed.startsWith('KEY')) return;
      let name = null;
      let def = null;
      if (trimmed.startsWith('`')) {
        const end = trimmed.indexOf('`', 1);
        if (end > 1) name = trimmed.slice(1, end);
        if (end > 1) def = trimmed.slice(end + 1).trim();
      } else {
        const parts = trimmed.split(/\s+/);
        name = parts[0]?.replace(/[,]/g, '');
        def = trimmed.slice(name.length).trim();
      }
      if (name) {
        name = name.replace(/,$/, '');
        if (!name.startsWith(')')) {
          if (withDefs) {
            const cleaned = String(def || '')
              .replace(/,$/, '')
              .replace(/\s+COMMENT\s+'.*?'/i, '')
              .replace(/DEFAULT\s+\(CURRENT_TIMESTAMP\)/i, 'DEFAULT CURRENT_TIMESTAMP')
              .trim();
            columns.set(name, cleaned);
          } else {
            columns.add(name);
          }
        }
      }
    });
    tables.set(tableName, columns);
  }
  return tables;
};

const loadDocSchema = () => {
  const baseSql = fs.readFileSync(files[0], 'utf8');
  const meetingSql = fs.readFileSync(files[1], 'utf8');
  const bookingSql = fs.readFileSync(files[2], 'utf8');
  const baseTables = parseTables(baseSql, 'mysql');
  const baseDefs = parseTables(baseSql, 'mysql', true);
  const meetingTables = parseTables(meetingSql, 'pg');
  const bookingTables = parseTables(bookingSql, 'pg');
  return { baseTables, baseDefs, meetingTables, bookingTables };
};

const main = async () => {
  const { baseTables, baseDefs, meetingTables, bookingTables } = loadDocSchema();
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const dbColumns = await client.query(
    "select table_name, column_name from information_schema.columns where table_schema = 'public' order by table_name, ordinal_position"
  );
  const dbMap = new Map();
  dbColumns.rows.forEach((row) => {
    if (!dbMap.has(row.table_name)) dbMap.set(row.table_name, new Set());
    dbMap.get(row.table_name).add(row.column_name);
  });

  const checkTables = (tables, label) => {
    const missingTables = [];
    const missingColumns = [];
    tables.forEach((cols, table) => {
      if (!dbMap.has(table)) {
        missingTables.push(table);
        return;
      }
      const dbCols = dbMap.get(table);
      cols.forEach((col) => {
        if (!dbCols.has(col)) {
          missingColumns.push({ table, column: col });
        }
      });
    });
    return { label, missingTables, missingColumns };
  };

  const baseCheck = checkTables(baseTables, 'base.sql');
  const meetingCheck = checkTables(meetingTables, '20260311_meeting_link_configuration.sql');
  const bookingCheck = checkTables(bookingTables, '20260318_booking_preferences.sql');

  const checks = [baseCheck, meetingCheck, bookingCheck];
  const report = JSON.stringify({ checks }, null, 2);
  console.log(report);
  fs.writeFileSync(path.resolve(__dirname, '..', 'db_schema_report.json'), report, 'utf8');

  const runSqlFile = async (sqlPath) => {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await client.query(sql);
  };

  if (meetingCheck.missingTables.length || meetingCheck.missingColumns.length) {
    await runSqlFile(files[1]);
    console.log('APPLIED: 20260311_meeting_link_configuration.sql');
  }

  if (bookingCheck.missingTables.length || bookingCheck.missingColumns.length) {
    await runSqlFile(files[2]);
    console.log('APPLIED: 20260318_booking_preferences.sql');
  }

  const pkResult = await client.query(
    "select tc.table_name, kc.column_name from information_schema.table_constraints tc join information_schema.key_column_usage kc on tc.constraint_name = kc.constraint_name and tc.table_schema = kc.table_schema where tc.table_schema = 'public' and tc.constraint_type = 'PRIMARY KEY'"
  );
  const pkMap = new Map();
  pkResult.rows.forEach((row) => {
    if (!pkMap.has(row.table_name)) pkMap.set(row.table_name, new Set());
    pkMap.get(row.table_name).add(row.column_name);
  });

  if (baseCheck.missingColumns.length) {
    for (const item of baseCheck.missingColumns) {
      const def = baseDefs.get(item.table)?.get(item.column);
      if (!def) continue;
      if (item.table === 'user_agreements' && item.column === 'id') {
        await client.query("ALTER TABLE user_agreements ADD COLUMN IF NOT EXISTS id BIGINT");
        await client.query("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'user_agreements_id_seq') THEN CREATE SEQUENCE user_agreements_id_seq; END IF; END $$");
        await client.query("ALTER TABLE user_agreements ALTER COLUMN id SET DEFAULT nextval('user_agreements_id_seq')");
        await client.query("UPDATE user_agreements SET id = nextval('user_agreements_id_seq') WHERE id IS NULL");
        await client.query("ALTER TABLE user_agreements ALTER COLUMN id SET NOT NULL");
        if (!pkMap.has('user_agreements') || !pkMap.get('user_agreements').size) {
          await client.query("ALTER TABLE user_agreements ADD PRIMARY KEY (id)");
        }
        continue;
      }
      await client.query(`ALTER TABLE ${item.table} ADD COLUMN IF NOT EXISTS ${item.column} ${def}`);
    }
    console.log('APPLIED: base.sql missing columns');
  }

  if (baseCheck.missingTables.length) {
    console.log('BASE_MISSING_TABLES');
  }

  await client.end();
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

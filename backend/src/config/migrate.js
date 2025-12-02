const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
});

async function runMigrations() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    // Create SequelizeMeta table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
        name VARCHAR(255) NOT NULL PRIMARY KEY
      );
    `);

    // Get list of executed migrations
    const [executedMigrations] = await sequelize.query(
      'SELECT name FROM "SequelizeMeta" ORDER BY name;'
    );
    const executedNames = executedMigrations.map(m => m.name);

    // Get list of migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.js'))
      .sort();

    console.log(`\nFound ${migrationFiles.length} migration file(s)`);
    console.log(`Already executed: ${executedNames.length} migration(s)\n`);

    // Run pending migrations
    for (const file of migrationFiles) {
      if (executedNames.includes(file)) {
        console.log(`⊘ Skipping ${file} (already executed)`);
        continue;
      }

      console.log(`→ Running migration: ${file}`);
      const migration = require(path.join(migrationsDir, file));
      
      await migration.up(sequelize.getQueryInterface(), Sequelize);
      
      // Record migration as executed
      await sequelize.query(
        'INSERT INTO "SequelizeMeta" (name) VALUES (?);',
        { replacements: [file] }
      );
      
      console.log(`✓ Completed: ${file}\n`);
    }

    console.log('✓ All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();

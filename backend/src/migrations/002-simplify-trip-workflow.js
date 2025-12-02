/**
 * Migration: Simplify Trip Workflow
 * 
 * Changes:
 * 1. Simplify trip status: planning/active/completed → open/closed
 * 2. Simplify trip_items status: packed/returned → taken/returned/lost
 * 3. Remove unnecessary constraints
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. Drop default value first
      await queryInterface.sequelize.query(`
        ALTER TABLE trips 
        ALTER COLUMN status DROP DEFAULT;
      `, { transaction });

      // 2. Convert trips status column to VARCHAR
      await queryInterface.sequelize.query(`
        ALTER TABLE trips 
        ALTER COLUMN status TYPE VARCHAR(50);
      `, { transaction });

      // 3. Update existing trip statuses to new simplified statuses
      await queryInterface.sequelize.query(`
        UPDATE trips 
        SET status = CASE 
          WHEN status = 'completed' THEN 'closed'
          WHEN status = 'active' THEN 'open'
          WHEN status = 'planning' THEN 'open'
          ELSE 'open'
        END;
      `, { transaction });

      // 4. Drop old enum and create new one for trips
      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS "enum_trips_status" CASCADE;
      `, { transaction });

      await queryInterface.sequelize.query(`
        CREATE TYPE "enum_trips_status" AS ENUM('open', 'closed');
      `, { transaction });

      await queryInterface.sequelize.query(`
        ALTER TABLE trips 
        ALTER COLUMN status TYPE "enum_trips_status" 
        USING status::"enum_trips_status";
      `, { transaction });

      // 5. Drop default value for trip_items first
      await queryInterface.sequelize.query(`
        ALTER TABLE trip_items 
        ALTER COLUMN status DROP DEFAULT;
      `, { transaction });

      // 6. Convert trip_items status column to VARCHAR
      await queryInterface.sequelize.query(`
        ALTER TABLE trip_items 
        ALTER COLUMN status TYPE VARCHAR(50);
      `, { transaction });

      // 7. Update trip_items status values
      await queryInterface.sequelize.query(`
        UPDATE trip_items 
        SET status = CASE 
          WHEN status = 'packed' THEN 'taken'
          WHEN status = 'returned' THEN 'returned'
          ELSE 'taken'
        END;
      `, { transaction });

      // 8. Drop old enum
      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS "enum_trip_items_status" CASCADE;
      `, { transaction });

      await queryInterface.sequelize.query(`
        CREATE TYPE "enum_trip_items_status" AS ENUM('taken', 'returned', 'lost', 'not_found');
      `, { transaction });

      await queryInterface.sequelize.query(`
        ALTER TABLE trip_items 
        ALTER COLUMN status TYPE "enum_trip_items_status" 
        USING status::"enum_trip_items_status";
      `, { transaction });

      // 9. Rename columns for clarity (check if they exist first)
      const [columns] = await queryInterface.sequelize.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'trip_items' AND table_schema = 'public';
      `, { transaction });
      
      const columnNames = columns.map(c => c.column_name);
      
      if (columnNames.includes('packed_at')) {
        await queryInterface.renameColumn('trip_items', 'packed_at', 'added_at', { transaction });
      }
      if (columnNames.includes('packed_by')) {
        await queryInterface.renameColumn('trip_items', 'packed_by', 'added_by', { transaction });
      }
      if (columnNames.includes('condition_notes')) {
        await queryInterface.renameColumn('trip_items', 'condition_notes', 'notes_when_added', { transaction });
      }
      if (columnNames.includes('return_condition_notes')) {
        await queryInterface.renameColumn('trip_items', 'return_condition_notes', 'notes_when_returned', { transaction });
      }

      // 11. Set default status for trip_items
      await queryInterface.sequelize.query(`
        ALTER TABLE trip_items 
        ALTER COLUMN status SET DEFAULT 'taken';
      `, { transaction });

      // 12. Set default status for trips
      await queryInterface.sequelize.query(`
        ALTER TABLE trips 
        ALTER COLUMN status SET DEFAULT 'open';
      `, { transaction });

      await transaction.commit();
      console.log('✓ Migration completed: Simplified trip workflow');
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Revert changes (reverse order)
      
      // 1. Revert trip_items column names
      await queryInterface.renameColumn('trip_items', 'added_at', 'packed_at', { transaction });
      await queryInterface.renameColumn('trip_items', 'added_by', 'packed_by', { transaction });
      await queryInterface.renameColumn('trip_items', 'notes_when_added', 'condition_notes', { transaction });
      await queryInterface.renameColumn('trip_items', 'notes_when_returned', 'return_condition_notes', { transaction });

      // 2. Revert trip_items status enum
      await queryInterface.sequelize.query(`
        ALTER TABLE trip_items 
        ALTER COLUMN status TYPE VARCHAR(50);
      `, { transaction });

      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS "enum_trip_items_status";
      `, { transaction });

      await queryInterface.sequelize.query(`
        CREATE TYPE "enum_trip_items_status" AS ENUM('packed', 'returned');
      `, { transaction });

      await queryInterface.sequelize.query(`
        UPDATE trip_items 
        SET status = CASE 
          WHEN status IN ('taken', 'lost', 'not_found') THEN 'packed'
          WHEN status = 'returned' THEN 'returned'
          ELSE 'packed'
        END;
      `, { transaction });

      await queryInterface.sequelize.query(`
        ALTER TABLE trip_items 
        ALTER COLUMN status TYPE "enum_trip_items_status" 
        USING status::"enum_trip_items_status";
      `, { transaction });

      // 3. Revert trips status enum
      await queryInterface.sequelize.query(`
        ALTER TABLE trips 
        ALTER COLUMN status TYPE VARCHAR(50);
      `, { transaction });

      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS "enum_trips_status";
      `, { transaction });

      await queryInterface.sequelize.query(`
        CREATE TYPE "enum_trips_status" AS ENUM('planning', 'active', 'completed');
      `, { transaction });

      await queryInterface.sequelize.query(`
        UPDATE trips 
        SET status = CASE 
          WHEN status = 'closed' THEN 'completed'
          ELSE 'planning'
        END;
      `, { transaction });

      await queryInterface.sequelize.query(`
        ALTER TABLE trips 
        ALTER COLUMN status TYPE "enum_trips_status" 
        USING status::"enum_trips_status";
      `, { transaction });

      await transaction.commit();
      console.log('✓ Migration reverted: Restored complex trip workflow');
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Migration revert failed:', error);
      throw error;
    }
  }
};

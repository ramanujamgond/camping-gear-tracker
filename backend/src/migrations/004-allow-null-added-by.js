/**
 * Migration: Allow NULL for added_by and returned_by in trip_items table
 * 
 * This allows super-admin (who doesn't have a UUID) to add/return items
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Allow NULL for added_by in trip_items table
      await queryInterface.sequelize.query(`
        ALTER TABLE trip_items 
        ALTER COLUMN added_by DROP NOT NULL;
      `, { transaction });

      // Allow NULL for returned_by (it's probably already nullable, but just in case)
      await queryInterface.sequelize.query(`
        ALTER TABLE trip_items 
        ALTER COLUMN returned_by DROP NOT NULL;
      `, { transaction });

      await transaction.commit();
      console.log('✓ Migration completed: Allow NULL for added_by and returned_by');
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Revert: Make added_by NOT NULL again
      await queryInterface.sequelize.query(`
        ALTER TABLE trip_items 
        ALTER COLUMN added_by SET NOT NULL;
      `, { transaction });

      await transaction.commit();
      console.log('✓ Migration reverted: added_by is NOT NULL again');
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Migration revert failed:', error);
      throw error;
    }
  }
};

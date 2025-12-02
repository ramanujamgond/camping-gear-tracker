/**
 * Migration: Allow NULL for created_by in trips table
 * 
 * This allows super-admin (who doesn't have a UUID) to create trips
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Allow NULL for created_by in trips table
      await queryInterface.sequelize.query(`
        ALTER TABLE trips 
        ALTER COLUMN created_by DROP NOT NULL;
      `, { transaction });

      await transaction.commit();
      console.log('✓ Migration completed: Allow NULL for created_by');
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Revert: Make created_by NOT NULL again
      await queryInterface.changeColumn('trips', 'created_by', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      }, { transaction });

      await transaction.commit();
      console.log('✓ Migration reverted: created_by is NOT NULL again');
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Migration revert failed:', error);
      throw error;
    }
  }
};

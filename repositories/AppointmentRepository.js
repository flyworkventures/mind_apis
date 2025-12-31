/**
 * Appointment Repository
 * Database operations for appointments
 */

const pool = require('../config/database');
const Appointment = require('../models/Appointment');

class AppointmentRepository {
  /**
   * Map database row to Appointment model
   * @param {Object} row - Database row
   * @returns {Appointment} Appointment instance
   */
  static mapRowToAppointment(row) {
    return new Appointment({
      id: row.id,
      userId: row.user_id,
      consultantId: row.consultant_id,
      appointmentDate: row.appointment_date,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  /**
   * Create a new appointment
   * @param {number} userId - User ID
   * @param {number} consultantId - Consultant ID
   * @param {string} appointmentDate - Appointment date (ISO 8601 format)
   * @param {string} status - Appointment status (default: 'pending')
   * @returns {Promise<Appointment>} Created appointment
   */
  static async create(userId, consultantId, appointmentDate, status = 'pending') {
    try {
      const [result] = await pool.execute(
        `INSERT INTO appointments (user_id, consultant_id, appointment_date, status)
         VALUES (?, ?, ?, ?)`,
        [userId, consultantId, appointmentDate, status]
      );

      return await this.findById(result.insertId);
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  /**
   * Find appointment by ID
   * @param {number} id - Appointment ID
   * @returns {Promise<Appointment|null>} Appointment or null
   */
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM appointments WHERE id = ?`,
        [id]
      );

      if (rows.length === 0) {
        return null;
      }

      return this.mapRowToAppointment(rows[0]);
    } catch (error) {
      console.error('Error finding appointment by ID:', error);
      throw error;
    }
  }

  /**
   * Find appointments by user ID
   * @param {number} userId - User ID
   * @returns {Promise<Array<Appointment>>} Array of appointments
   */
  static async findByUserId(userId) {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM appointments 
         WHERE user_id = ? 
         ORDER BY appointment_date ASC`,
        [userId]
      );

      return rows.map(row => this.mapRowToAppointment(row));
    } catch (error) {
      console.error('Error finding appointments by user ID:', error);
      throw error;
    }
  }

  /**
   * Find appointments by consultant ID
   * @param {number} consultantId - Consultant ID
   * @returns {Promise<Array<Appointment>>} Array of appointments
   */
  static async findByConsultantId(consultantId) {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM appointments 
         WHERE consultant_id = ? 
         ORDER BY appointment_date ASC`,
        [consultantId]
      );

      return rows.map(row => this.mapRowToAppointment(row));
    } catch (error) {
      console.error('Error finding appointments by consultant ID:', error);
      throw error;
    }
  }

  /**
   * Update appointment status
   * @param {number} id - Appointment ID
   * @param {string} status - New status
   * @returns {Promise<Appointment>} Updated appointment
   */
  static async updateStatus(id, status) {
    try {
      await pool.execute(
        `UPDATE appointments SET status = ? WHERE id = ?`,
        [status, id]
      );

      return await this.findById(id);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  }

  /**
   * Find upcoming appointment by user ID (nearest future appointment)
   * @param {number} userId - User ID
   * @returns {Promise<Appointment|null>} Upcoming appointment or null
   */
  static async findUpcomingByUserId(userId) {
    try {
      const now = new Date().toISOString();
      const [rows] = await pool.execute(
        `SELECT * FROM appointments 
         WHERE user_id = ? 
           AND appointment_date >= ?
           AND status != 'cancelled'
         ORDER BY appointment_date ASC
         LIMIT 1`,
        [userId, now]
      );

      if (rows.length === 0) {
        return null;
      }

      return this.mapRowToAppointment(rows[0]);
    } catch (error) {
      console.error('Error finding upcoming appointment by user ID:', error);
      throw error;
    }
  }

  /**
   * Delete all appointments for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Number of deleted appointments
   */
  static async deleteByUserId(userId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM appointments WHERE user_id = ?',
        [userId]
      );
      
      return result.affectedRows;
    } catch (error) {
      console.error('Error deleting appointments by user ID:', error);
      throw error;
    }
  }
}

module.exports = AppointmentRepository;


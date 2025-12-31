/**
 * Chat Repository
 * Database operations for chats
 */

const pool = require('../config/database');
const Chat = require('../models/Chat');

class ChatRepository {
  /**
   * Map database row to Chat model
   * @param {Object} row - Database row
   * @returns {Chat} Chat instance
   */
  static mapRowToChat(row) {
    return new Chat({
      id: row.id,
      consultant_id: row.consultant_id,
      user_id: row.user_id,
      created_date: row.created_date,
      last_message: row.last_message,
      last_message_date: row.last_message_date
    });
  }

  /**
   * Create a new chat
   * @param {number} consultantId - Consultant ID
   * @param {number} userId - User ID
   * @param {string} createdDate - Created date (ISO 8601 format)
   * @returns {Promise<Chat>} Created chat
   */
  static async create(consultantId, userId, createdDate) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO chats (consultant_id, user_id, created_date)
         VALUES (?, ?, ?)`,
        [consultantId, userId, createdDate]
      );

      return await this.findById(result.insertId);
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }

  /**
   * Find chat by ID
   * @param {number} id - Chat ID
   * @returns {Promise<Chat|null>} Chat or null
   */
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM chats WHERE id = ? LIMIT 1',
        [id]
      );

      if (rows.length === 0) {
        return null;
      }

      return this.mapRowToChat(rows[0]);
    } catch (error) {
      console.error('Error finding chat by ID:', error);
      throw error;
    }
  }

  /**
   * Find chat by user and consultant
   * @param {number} userId - User ID
   * @param {number} consultantId - Consultant ID
   * @returns {Promise<Chat|null>} Chat or null
   */
  static async findByUserAndConsultant(userId, consultantId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM chats WHERE user_id = ? AND consultant_id = ? LIMIT 1',
        [userId, consultantId]
      );

      if (rows.length === 0) {
        return null;
      }

      return this.mapRowToChat(rows[0]);
    } catch (error) {
      console.error('Error finding chat by user and consultant:', error);
      throw error;
    }
  }

  /**
   * Find all chats for a user
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of chats
   */
  static async findByUserId(userId, options = {}) {
    try {
      const limit = options.limit || 100;
      const offset = options.offset || 0;
      const orderBy = options.orderBy || 'last_message_date DESC, created_at DESC';

      const [rows] = await pool.execute(
        `SELECT * FROM chats 
         WHERE user_id = ?
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );

      return rows.map(row => this.mapRowToChat(row));
    } catch (error) {
      console.error('Error finding chats by user ID:', error);
      throw error;
    }
  }

  /**
   * Update chat last message
   * @param {number} chatId - Chat ID
   * @param {string} lastMessage - Last message text
   * @param {string} lastMessageDate - Last message date (ISO 8601 format)
   * @returns {Promise<boolean>} Success status
   */
  static async updateLastMessage(chatId, lastMessage, lastMessageDate) {
    try {
      const [result] = await pool.execute(
        `UPDATE chats 
         SET last_message = ?, last_message_date = ?
         WHERE id = ?`,
        [lastMessage, lastMessageDate, chatId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating chat last message:', error);
      throw error;
    }
  }

  /**
   * Delete all chats for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Number of deleted chats
   */
  static async deleteByUserId(userId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM chats WHERE user_id = ?',
        [userId]
      );
      
      return result.affectedRows;
    } catch (error) {
      console.error('Error deleting chats by user ID:', error);
      throw error;
    }
  }
}

module.exports = ChatRepository;


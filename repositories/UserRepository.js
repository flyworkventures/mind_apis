/**
 * User Repository
 * Database operations for users
 */

const pool = require('../config/database');

class UserRepository {
  /**
   * Find user by credential and provider ID
   * @param {string} credential - 'google', 'facebook', or 'apple'
   * @param {string} providerId - Provider-specific user ID
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByCredential(credential, providerId) {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM users 
         WHERE credential = ? 
         AND JSON_EXTRACT(credential_data, '$.id') = ? 
         LIMIT 1`,
        [credential, providerId]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding user by credential:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE id = ? LIMIT 1',
        [id]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByUsername(username) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE username = ? LIMIT 1',
        [username]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  }

  /**
   * Create new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user object
   */
  static async create(userData) {
    try {
      const {
        credential,
        credentialData,
        username,
        nativeLang,
        gender,
        answerData,
        lastPsychologicalProfile,
        userAgentNotes,
        leastSessions,
        psychologicalProfileBasedOnMessages,
        accountCreatedDate,
        generalProfile,
        generalPsychologicalProfile,
        profilePhotoUrl
      } = userData;

      const [result] = await pool.execute(
        `INSERT INTO users (
          credential, credential_data, username, native_lang, gender,
          answer_data, last_psychological_profile, user_agent_notes,
          least_sessions, psychological_profile_based_on_messages,
          account_created_date, general_profile, general_psychological_profile,
          profile_photo_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          credential,
          JSON.stringify(credentialData),
          username,
          nativeLang || null,
          gender || 'unknown',
          answerData ? JSON.stringify(answerData) : null,
          lastPsychologicalProfile || null,
          userAgentNotes ? JSON.stringify(userAgentNotes) : null,
          leastSessions ? JSON.stringify(leastSessions) : null,
          psychologicalProfileBasedOnMessages || null,
          accountCreatedDate || new Date().toISOString(),
          generalProfile || null,
          generalPsychologicalProfile || null,
          profilePhotoUrl || null
        ]
      );

      // Return created user
      return await this.findById(result.insertId);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user
   * @param {number} id - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object|null>} Updated user object or null
   */
  static async update(id, userData) {
    try {
      const updateFields = [];
      const updateValues = [];

      // Build dynamic update query
      if (userData.credential !== undefined) {
        updateFields.push('credential = ?');
        updateValues.push(userData.credential);
      }
      if (userData.credentialData !== undefined) {
        updateFields.push('credential_data = ?');
        updateValues.push(JSON.stringify(userData.credentialData));
      }
      if (userData.username !== undefined) {
        updateFields.push('username = ?');
        updateValues.push(userData.username);
      }
      if (userData.nativeLang !== undefined) {
        updateFields.push('native_lang = ?');
        updateValues.push(userData.nativeLang);
      }
      if (userData.gender !== undefined) {
        updateFields.push('gender = ?');
        updateValues.push(userData.gender);
      }
      if (userData.answerData !== undefined) {
        updateFields.push('answer_data = ?');
        updateValues.push(userData.answerData ? JSON.stringify(userData.answerData) : null);
      }
      if (userData.lastPsychologicalProfile !== undefined) {
        updateFields.push('last_psychological_profile = ?');
        updateValues.push(userData.lastPsychologicalProfile);
      }
      if (userData.userAgentNotes !== undefined) {
        updateFields.push('user_agent_notes = ?');
        updateValues.push(userData.userAgentNotes ? JSON.stringify(userData.userAgentNotes) : null);
      }
      if (userData.leastSessions !== undefined) {
        updateFields.push('least_sessions = ?');
        updateValues.push(userData.leastSessions ? JSON.stringify(userData.leastSessions) : null);
      }
      if (userData.psychologicalProfileBasedOnMessages !== undefined) {
        updateFields.push('psychological_profile_based_on_messages = ?');
        updateValues.push(userData.psychologicalProfileBasedOnMessages);
      }
      if (userData.generalProfile !== undefined) {
        updateFields.push('general_profile = ?');
        updateValues.push(userData.generalProfile);
      }
      if (userData.generalPsychologicalProfile !== undefined) {
        updateFields.push('general_psychological_profile = ?');
        updateValues.push(userData.generalPsychologicalProfile);
      }
      if (userData.profilePhotoUrl !== undefined) {
        updateFields.push('profile_photo_url = ?');
        updateValues.push(userData.profilePhotoUrl);
      }

      if (updateFields.length === 0) {
        return await this.findById(id);
      }

      updateValues.push(id);

      await pool.execute(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      return await this.findById(id);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete user (soft delete - set deleted flag if needed)
   * @param {number} id - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM users WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Convert database row to User model format
   * @param {Object} row - Database row
   * @returns {Object} User model object
   */
  static mapRowToUser(row) {
    return {
      id: row.id,
      credential: row.credential,
      credentialData: typeof row.credential_data === 'string' 
        ? JSON.parse(row.credential_data) 
        : row.credential_data,
      username: row.username,
      nativeLang: row.native_lang,
      gender: row.gender,
      answerData: row.answer_data 
        ? (typeof row.answer_data === 'string' ? JSON.parse(row.answer_data) : row.answer_data)
        : null,
      lastPsychologicalProfile: row.last_psychological_profile,
      userAgentNotes: row.user_agent_notes
        ? (typeof row.user_agent_notes === 'string' ? JSON.parse(row.user_agent_notes) : row.user_agent_notes)
        : null,
      leastSessions: row.least_sessions
        ? (typeof row.least_sessions === 'string' ? JSON.parse(row.least_sessions) : row.least_sessions)
        : null,
      psychologicalProfileBasedOnMessages: row.psychological_profile_based_on_messages,
      accountCreatedDate: row.account_created_date ? new Date(row.account_created_date).toISOString() : null,
      generalProfile: row.general_profile,
      generalPsychologicalProfile: row.general_psychological_profile,
      profilePhotoUrl: row.profile_photo_url
    };
  }
}

module.exports = UserRepository;


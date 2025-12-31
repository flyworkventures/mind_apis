/**
 * User Service
 * Business logic for user operations
 */

const UserRepository = require('../repositories/UserRepository');
const User = require('../models/User');

class UserService {
  /**
   * Find or create user
   * @param {Object} providerData - Provider authentication data
   * @param {string} credential - Provider name
   * @returns {Promise<Object>} User object
   */
  static async findOrCreateUser(providerData, credential) {
    try {
      // Check if user exists
      const existingUser = await UserRepository.findByCredential(
        credential,
        providerData.id
      );

      if (existingUser) {
        // User exists, update profile photo if provided
        const userData = UserRepository.mapRowToUser(existingUser);
        
        const updateData = {};
        
        // Update profile photo if it's different
        if (providerData.picture && providerData.picture !== userData.profilePhotoUrl) {
          updateData.profilePhotoUrl = providerData.picture;
        }
        
        // Eğer username hala temp ile başlıyorsa ve Apple'dan fullName geldiyse, güncelle
        if (userData.username && userData.username.startsWith('temp_') && 
            providerData.name && providerData.name.trim().length > 0) {
          updateData.username = providerData.name.trim();
        }
        
        // Eğer güncelleme yapılacak bir şey varsa
        if (Object.keys(updateData).length > 0) {
          await UserRepository.update(existingUser.id, updateData);
          if (updateData.profilePhotoUrl) userData.profilePhotoUrl = updateData.profilePhotoUrl;
          if (updateData.username) userData.username = updateData.username;
        }

        return new User(userData);
      }

      // Create new user - İlk oturum açmada sadece temel bilgiler
      // Username ve diğer bilgiler sonradan profil tamamlama ile eklenecek
      // Apple'dan gelen fullName varsa, onu username olarak kullan (boşluk kontrolü yok)
      let username;
      if (providerData.name && providerData.name.length > 0) {
        // Apple'dan gelen fullName'i username olarak kullan (trim yok, boşluklar korunur)
        username = providerData.name;
      } else {
        // Diğer durumlarda geçici username oluştur
        username = `temp_${providerData.id}_${Date.now()}`;
      }
      
      const newUserData = {
        credential: credential,
        credentialData: {
          providerId: providerData.providerId,
          email: providerData.email,
          id: providerData.id
        },
        username: username,
        gender: 'unknown',
        profilePhotoUrl: providerData.picture || null,
        answerData: null, // Profil tamamlanana kadar null
        accountCreatedDate: new Date().toISOString()
      };

      const createdUser = await UserRepository.create(newUserData);
      return new User(UserRepository.mapRowToUser(createdUser));
    } catch (error) {
      console.error('Error in findOrCreateUser:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  static async getUserById(userId) {
    try {
      const user = await UserRepository.findById(userId);
      if (!user) {
        return null;
      }
      return new User(UserRepository.mapRowToUser(user));
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  /**
   * Get user by username
   * @param {string} username - Username
   * @returns {Promise<Object|null>} User object or null
   */
  static async getUserByUsername(username) {
    try {
      const user = await UserRepository.findByUsername(username);
      if (!user) {
        return null;
      }
      return new User(UserRepository.mapRowToUser(user));
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {number} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user object
   */
  static async updateUser(userId, updateData) {
    try {
      // Username unique değil, herkes istediği ismi kullanabilir
      const updatedUser = await UserRepository.update(userId, updateData);
      if (!updatedUser) {
        throw new Error('User not found');
      }
      return new User(UserRepository.mapRowToUser(updatedUser));
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Check if user profile is complete
   * @param {Object} user - User object
   * @returns {boolean} True if profile is complete
   */
  static isProfileComplete(user) {
    return !!(
      user.username && 
      !user.username.startsWith('temp_') &&
      user.answerData &&
      user.answerData.supportArea &&
      user.answerData.agentSpeakStyle
    );
  }

  /**
   * Delete user account and all associated data
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async deleteUserAccount(userId) {
    try {
      // Delete all user-related data
      // Note: Foreign key constraints may require specific order
      
      // 1. Delete messages (cascades to chat updates)
      const MessageRepository = require('../repositories/MessageRepository');
      // Get all chats for user first
      const ChatRepository = require('../repositories/ChatRepository');
      const chats = await ChatRepository.findByUserId(userId);
      
      for (const chat of chats) {
        // Delete all messages in chat
        await MessageRepository.deleteByChatId(chat.chatId);
      }
      
      // 2. Delete chats
      await ChatRepository.deleteByUserId(userId);
      
      // 3. Delete appointments
      const AppointmentRepository = require('../repositories/AppointmentRepository');
      await AppointmentRepository.deleteByUserId(userId);
      
      // 4. Delete moods
      const MoodRepository = require('../repositories/MoodRepository');
      await MoodRepository.deleteByUserId(userId);
      
      // 5. Delete user tokens (already handled in auth route, but safe to do here too)
      const TokenRepository = require('../repositories/TokenRepository');
      await TokenRepository.revokeAll(userId);
      
      // 6. Finally, delete the user
      await UserRepository.delete(userId);
      
      return true;
    } catch (error) {
      console.error('Error deleting user account:', error);
      throw error;
    }
  }
}

module.exports = UserService;


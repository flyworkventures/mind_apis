/**
 * Chat Service
 * Business logic for chat operations
 */

const ChatRepository = require('../repositories/ChatRepository');
const MessageRepository = require('../repositories/MessageRepository');
const UserService = require('./userService');
const axios = require('axios');

class ChatService {
  /**
   * Get or create chat for user and consultant
   * @param {number} userId - User ID
   * @param {number} consultantId - Consultant ID
   * @returns {Promise<Chat>} Chat instance
   */
  static async getOrCreateChat(userId, consultantId) {
    try {
      // Check if chat already exists
      let chat = await ChatRepository.findByUserAndConsultant(userId, consultantId);
      
      if (!chat) {
        // Create new chat
        const createdDate = new Date().toISOString();
        chat = await ChatRepository.create(consultantId, userId, createdDate);
      }

      return chat;
    } catch (error) {
      console.error('Error getting or creating chat:', error);
      throw error;
    }
  }

  /**
   * Send message to assistant via webhook
   * @param {Object} webhookData - Webhook request data
   * @returns {Promise<Object>} Webhook response
   */
  static async sendToWebhook(webhookData, webhookUrl = null) {
    try {
      // Use provided webhook URL or default
      const url = webhookUrl || 'http://89.252.179.227:5678/webhook-test/chat-assistant';
      
      console.log(`[WEBHOOK] 📤 Sending to webhook: ${url}`);
      
      const response = await axios.post(url, webhookData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      });

      console.log(`[WEBHOOK] ✅ Webhook response received:`, response.status);
      return response.data;
    } catch (error) {
      console.error('[WEBHOOK] ❌ Error sending to webhook:', error.message);
      if (error.response) {
        console.error('[WEBHOOK] ❌ Response status:', error.response.status);
        console.error('[WEBHOOK] ❌ Response data:', error.response.data);
      }
      throw new Error(`Webhook request failed: ${error.message}`);
    }
  }

  /**
   * Send message from user
   * @param {number} userId - User ID
   * @param {number} consultantId - Consultant ID
   * @param {string} message - Message content
   * @param {boolean} isFile - Whether message is a file (default: false)
   * @param {string} fileURL - File URL if message is a file (default: null)
   * @param {boolean} isVoiceMessage - Whether message is a voice message (default: false)
   * @param {string} voiceURL - Voice message URL if message is a voice message (default: null)
   * @param {string} imageContent - AI-analyzed image content (default: null)
   * @param {string} voiceMessageContent - Transcribed voice message content (default: null)
   * @returns {Promise<Object>} Response with chat and message
   */
  static async sendMessage(userId, consultantId, message, isFile = false, fileURL = null, isVoiceMessage = false, voiceURL = null, imageContent = null, voiceMessageContent = null) {
    try {
      // Get or create chat
      const chat = await this.getOrCreateChat(userId, consultantId);
      
      // Get user info
      const user = await UserService.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Create user message
      const sentTime = new Date().toISOString();
      const userMessage = await MessageRepository.create(
        chat.chatId,
        userId,
        'user',
        message,
        sentTime,
        isFile,
        fileURL,
        isVoiceMessage,
        voiceURL,
        imageContent,
        voiceMessageContent
      );

      // Update chat last message (use appropriate indicator)
      let lastMessageText = message;
      if (isVoiceMessage) {
        lastMessageText = message || '[Voice Message]';
      } else if (isFile) {
        lastMessageText = message || '[File]';
      }
      await ChatRepository.updateLastMessage(chat.chatId, lastMessageText, sentTime);

      // Get chat history for webhook
      const chatHistory = await MessageRepository.getChatHistory(chat.chatId, 50);

      // Determine message type
      let messageType = 'text';
      if (isVoiceMessage) {
        messageType = 'voice';
      } else if (isFile) {
        messageType = 'image';
      }

      // Prepare webhook message content
      // For image: use imageContent if available, otherwise use message
      // For voice: use voiceMessageContent if available, otherwise use message
      // For text: use message
      let webhookMessage = message;
      if (isFile && imageContent) {
        webhookMessage = imageContent;
      } else if (isVoiceMessage && voiceMessageContent) {
        webhookMessage = voiceMessageContent;
      }

      // Prepare webhook data
      const webhookData = {
        id: consultantId,
        chatId: chat.chatId,
        nativeLang: user.nativeLang || 'tr',
        message: webhookMessage,
        messageType: messageType,
        // Add URL if message is image or voice
        ...(isFile && fileURL && { imageURL: fileURL }),
        ...(isVoiceMessage && voiceURL && { voiceURL: voiceURL }),
        userInfo: {
          username: user.username,
          phycoProfile: user.generalProfile || user.generalPsychologicalProfile || null,
          chatHistory: chatHistory,
          aiComments: user.userAgentNotes || []
        }
      };

      // Send to webhook asynchronously (fire-and-forget)
      // Don't wait for webhook response, send it in background
      this.sendToWebhook(webhookData).catch(error => {
        console.error('Webhook error (background):', error.message);
        // Log error but don't affect the response
      });

      // Return immediately without waiting for webhook
      return {
        chat: chat,
        message: userMessage
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get all chats for a user
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of chats
   */
  static async getUserChats(userId, options = {}) {
    try {
      return await ChatRepository.findByUserId(userId, options);
    } catch (error) {
      console.error('Error getting user chats:', error);
      throw error;
    }
  }

  /**
   * Get chat by ID
   * @param {number} chatId - Chat ID
   * @param {number} userId - User ID (for authorization check)
   * @returns {Promise<Chat|null>} Chat or null
   */
  static async getChatById(chatId, userId) {
    try {
      const chat = await ChatRepository.findById(chatId);
      
      if (!chat) {
        return null;
      }

      // Check if user owns this chat
      if (chat.userId !== userId) {
        throw new Error('Unauthorized: Chat does not belong to user');
      }

      return chat;
    } catch (error) {
      console.error('Error getting chat by ID:', error);
      throw error;
    }
  }

  /**
   * Get messages for a chat
   * @param {number} chatId - Chat ID
   * @param {number} userId - User ID (for authorization check)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of messages
   */
  static async getChatMessages(chatId, userId, options = {}) {
    try {
      // Verify chat belongs to user
      const chat = await ChatRepository.findById(chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }
      if (chat.userId !== userId) {
        throw new Error('Unauthorized: Chat does not belong to user');
      }

      return await MessageRepository.findByChatId(chatId, options);
    } catch (error) {
      console.error('Error getting chat messages:', error);
      throw error;
    }
  }

  /**
   * Get messages by consultant ID
   * @param {number} consultantId - Consultant ID
   * @param {number} userId - User ID (for authorization check)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of messages
   */
  static async getMessagesByConsultant(consultantId, userId, options = {}) {
    try {
      // Find chat by user and consultant
      const chat = await ChatRepository.findByUserAndConsultant(userId, consultantId);
      
      if (!chat) {
        // No chat exists, return empty array
        return [];
      }

      // Get messages for the chat
      return await MessageRepository.findByChatId(chat.chatId, options);
    } catch (error) {
      console.error('Error getting messages by consultant:', error);
      throw error;
    }
  }
}

module.exports = ChatService;


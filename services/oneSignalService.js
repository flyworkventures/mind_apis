/**
 * OneSignal Service
 * Handles push notifications via OneSignal API
 */

const axios = require('axios');

class OneSignalService {
  /**
   * Send push notification to specific user(s)
   * @param {number|number[]} userIds - User ID(s) to send notification to
   * @param {string} title - Notification title
   * @param {string} subtitle - Notification subtitle/body
   * @param {Object} metadata - Additional metadata (optional)
   * @param {string} type - Notification type: 'system_notification' or 'announcement' (optional)
   * @returns {Promise<Object>} OneSignal API response
   */
  static async sendNotification(userIds, title, subtitle, metadata = {}, type = 'system_notification') {
    try {
      const appId = process.env.ONESIGNAL_APP_ID;
      const apiKey = process.env.ONESIGNAL_REST_API_KEY;

      if (!appId || !apiKey) {
        throw new Error('OneSignal configuration is missing. Please check ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY environment variables.');
      }

      // Convert single userId to array
      const userIdArray = Array.isArray(userIds) ? userIds : [userIds];

      // Prepare OneSignal API request
      const notification = {
        app_id: appId,
        headings: { en: title },
        contents: { en: subtitle },
        data: {
          type: type,
          metadata: metadata,
          userIds: userIdArray
        },
        // Target specific users by external user IDs
        include_external_user_ids: userIdArray.map(id => id.toString()),
        // Optional: Add sound, badge, etc.
        sound: 'default',
        priority: 10
      };

      // Send notification via OneSignal REST API
      const response = await axios.post(
        'https://onesignal.com/api/v1/notifications',
        notification,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${apiKey}`
          }
        }
      );

      console.log(`✅ OneSignal notification sent successfully. Recipients: ${userIdArray.length}, OneSignal ID: ${response.data.id}`);
      
      return {
        success: true,
        oneSignalId: response.data.id,
        recipients: userIdArray.length,
        data: response.data
      };
    } catch (error) {
      console.error('❌ OneSignal notification error:', error.message);
      if (error.response) {
        console.error('❌ OneSignal response status:', error.response.status);
        console.error('❌ OneSignal response data:', error.response.data);
      }
      throw new Error(`Failed to send OneSignal notification: ${error.message}`);
    }
  }

  /**
   * Send notification to all users (broadcast)
   * @param {string} title - Notification title
   * @param {string} subtitle - Notification subtitle/body
   * @param {Object} metadata - Additional metadata (optional)
   * @param {string} type - Notification type: 'system_notification' or 'announcement' (optional)
   * @returns {Promise<Object>} OneSignal API response
   */
  static async sendBroadcastNotification(title, subtitle, metadata = {}, type = 'announcement') {
    try {
      const appId = process.env.ONESIGNAL_APP_ID;
      const apiKey = process.env.ONESIGNAL_REST_API_KEY;

      if (!appId || !apiKey) {
        throw new Error('OneSignal configuration is missing. Please check ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY environment variables.');
      }

      // Prepare OneSignal API request for broadcast
      const notification = {
        app_id: appId,
        headings: { en: title },
        contents: { en: subtitle },
        data: {
          type: type,
          metadata: metadata
        },
        // Send to all subscribed users
        included_segments: ['All'],
        sound: 'default',
        priority: 10
      };

      // Send notification via OneSignal REST API
      const response = await axios.post(
        'https://onesignal.com/api/v1/notifications',
        notification,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${apiKey}`
          }
        }
      );

      console.log(`✅ OneSignal broadcast notification sent successfully. OneSignal ID: ${response.data.id}`);
      
      return {
        success: true,
        oneSignalId: response.data.id,
        recipients: 'all',
        data: response.data
      };
    } catch (error) {
      console.error('❌ OneSignal broadcast notification error:', error.message);
      if (error.response) {
        console.error('❌ OneSignal response status:', error.response.status);
        console.error('❌ OneSignal response data:', error.response.data);
      }
      throw new Error(`Failed to send OneSignal broadcast notification: ${error.message}`);
    }
  }
}

module.exports = OneSignalService;


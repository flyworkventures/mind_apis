/**
 * Appointment Service
 * Business logic for appointment operations
 */

const AppointmentRepository = require('../repositories/AppointmentRepository');
const UserService = require('./userService');
const ConsultantService = require('./consultantService');
const OneSignalService = require('./oneSignalService');
const NotificationRepository = require('../repositories/NotificationRepository');

class AppointmentService {
  /**
   * Create appointment from webhook
   * @param {number} userId - User ID (randevuyu alan kullanıcı)
   * @param {number} consultantId - Consultant ID (randevuyu veren kullanıcı)
   * @param {string} appointmentDate - Appointment date (ISO format)
   * @returns {Promise<Object>} Response with appointment and notification message
   */
  static async createAppointmentFromWebhook(userId, consultantId, appointmentDate) {
    try {
      // Validate user exists
      const user = await UserService.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Validate consultant exists
      const consultant = await ConsultantService.getConsultantById(consultantId);
      if (!consultant) {
        throw new Error('Consultant not found');
      }

      // Validate appointment date
      if (!appointmentDate) {
        throw new Error('Appointment date is required');
      }

      // Validate date format (ISO 8601)
      const date = new Date(appointmentDate);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid appointment date format. Expected ISO 8601 format.');
      }

      // Create appointment
      const appointment = await AppointmentRepository.create(
        userId,
        consultantId,
        appointmentDate,
        'pending'
      );

      // Get consultant name for notification
      const consultantName = consultant.names?.tr || consultant.names?.en || consultant.names?.de || 'Koç';
      
      // Prepare notification message
      const notificationTitle = 'Yeni Randevu';
      const notificationSubtitle = `${consultantName}, sizin için randevu oluşturdu`;
      const notificationMessage = 'Randevunuz oluşturuldu';

      // Send notification via OneSignal and save to database (async, don't wait)
      sendAppointmentNotification(userId, consultantId, notificationTitle, notificationSubtitle, appointment.id).catch(err => {
        console.error('⚠️ Failed to send appointment notification:', err.message);
      });

      return {
        success: true,
        appointment: appointment.toFlutterFormat(),
        notification: notificationMessage
      };
    } catch (error) {
      console.error('Error creating appointment from webhook:', error);
      throw error;
    }
  }

  /**
   * Get appointments by user ID
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of appointments
   */
  static async getAppointmentsByUserId(userId) {
    try {
      const appointments = await AppointmentRepository.findByUserId(userId);
      return appointments.map(appointment => appointment.toFlutterFormat());
    } catch (error) {
      console.error('Error getting appointments by user ID:', error);
      throw error;
    }
  }

  /**
   * Get appointments by consultant ID
   * @param {number} consultantId - Consultant ID
   * @returns {Promise<Array>} Array of appointments
   */
  static async getAppointmentsByConsultantId(consultantId) {
    try {
      const appointments = await AppointmentRepository.findByConsultantId(consultantId);
      return appointments.map(appointment => appointment.toFlutterFormat());
    } catch (error) {
      console.error('Error getting appointments by consultant ID:', error);
      throw error;
    }
  }

  /**
   * Get upcoming appointment by user ID (nearest future appointment)
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Upcoming appointment or null
   */
  static async getUpcomingAppointmentByUserId(userId) {
    try {
      const appointment = await AppointmentRepository.findUpcomingByUserId(userId);
      if (!appointment) {
        return null;
      }
      return appointment.toFlutterFormat();
    } catch (error) {
      console.error('Error getting upcoming appointment by user ID:', error);
      throw error;
    }
  }
}

/**
 * Helper function to send appointment notification
 * @param {number} userId - User ID
 * @param {number} consultantId - Consultant ID
 * @param {string} title - Notification title
 * @param {string} subtitle - Notification subtitle
 * @param {number} appointmentId - Appointment ID
 */
async function sendAppointmentNotification(userId, consultantId, title, subtitle, appointmentId) {
  try {
    const metadata = {
      type: 'appointment',
      appointmentId: appointmentId,
      consultantId: consultantId,
      timestamp: new Date().toISOString()
    };

    // Send via OneSignal (if configured)
    let oneSignalResult = null;
    try {
      oneSignalResult = await OneSignalService.sendNotification(
        userId,
        title,
        subtitle,
        metadata,
        'system_notification'
      );
    } catch (oneSignalError) {
      console.error('⚠️ OneSignal error (continuing to save to DB):', oneSignalError.message);
      // Continue even if OneSignal fails
    }

    // Save to database
    await NotificationRepository.create({
      user_id: userId,
      type: 'system_notification',
      title: title,
      subtitle: subtitle,
      metadata: {
        ...metadata,
        oneSignalId: oneSignalResult?.oneSignalId || null
      }
    });

    console.log(`✅ Appointment notification sent to user ${userId}`);
  } catch (error) {
    console.error('❌ Error sending appointment notification:', error);
    throw error;
  }
}

module.exports = AppointmentService;


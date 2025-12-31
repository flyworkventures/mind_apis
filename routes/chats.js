/**
 * Chats Routes
 * API endpoints for chat and message operations
 */

const router = require('express').Router();
const ChatService = require('../services/chatService');
const BunnyCDNService = require('../services/bunnyCDNService');
const SpeechToTextService = require('../services/speechToTextService');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

/**
 * @route POST /chats/send
 * @desc Send a message to a consultant
 * Supports both JSON (normal messages) and multipart/form-data (file/voice messages)
 * @header Authorization: Bearer <token>
 * 
 * For normal messages (JSON):
 * @body {number} consultantId - Consultant ID
 * @body {string} message - Message content
 * 
 * For file/voice messages (multipart/form-data):
 * @body {number} consultantId - Consultant ID
 * @body {string} message - Optional message/description
 * @body {File} file - Image file (for image messages)
 * @body {File} voice - Audio file (for voice messages)
 */
router.post('/send', authenticate, upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'voice', maxCount: 1 }
]), async (req, res, next) => {
  try {
    const userId = req.userId;
    let consultantId, message, fileURL = null, voiceURL = null;
    let isFileMessage = false;
    let isVoiceMsg = false;

    // Check if request has files (multipart/form-data)
    if (req.files) {
      const imageFile = req.files['file'] ? req.files['file'][0] : null;
      const voiceFile = req.files['voice'] ? req.files['voice'][0] : null;

      // Get form data
      consultantId = req.body.consultantId;
      message = req.body.message || '';

      // Validate consultantId
      if (!consultantId || isNaN(consultantId)) {
        return res.status(400).json({
          success: false,
          error: 'consultantId is required and must be a number'
        });
      }

      // Validate that only one file type is sent
      if (imageFile && voiceFile) {
        return res.status(400).json({
          success: false,
          error: 'Cannot send both image and voice file in the same request'
        });
      }

      if (!imageFile && !voiceFile) {
        return res.status(400).json({
          success: false,
          error: 'Either file (image) or voice (audio) must be provided'
        });
      }

      // Handle image file
      if (imageFile) {
        // Validate file type
        if (!BunnyCDNService.validateFileType(imageFile.originalname, 'image')) {
          return res.status(400).json({
            success: false,
            error: 'Invalid image file type. Allowed: jpg, jpeg, png, gif, webp, svg'
          });
        }

        // Upload to Bunny CDN
        fileURL = await BunnyCDNService.uploadFile(
          imageFile.buffer,
          imageFile.originalname,
          'image'
        );
        isFileMessage = true;
      }

      // Handle voice file
      if (voiceFile) {
        // Validate file type
        if (!BunnyCDNService.validateFileType(voiceFile.originalname, 'voice')) {
          return res.status(400).json({
            success: false,
            error: 'Invalid voice file type. Allowed: mp3, wav, ogg, m4a, aac'
          });
        }

        // Upload to Bunny CDN
        voiceURL = await BunnyCDNService.uploadFile(
          voiceFile.buffer,
          voiceFile.originalname,
          'voice'
        );
        isVoiceMsg = true;

        // 🎙️ Speech-to-Text: Ses dosyasını text'e çevir (video call'daki gibi)
        let transcription = null;
        try {
          console.log(`[CHAT] 🎤 Voice message transcription başlatılıyor...`);
          const UserService = require('../services/userService');
          const user = await UserService.getUserById(userId);
          const userLanguage = user?.nativeLang || 'tr'; // Default to Turkish
          
          transcription = await SpeechToTextService.transcribeAudio(
            voiceFile.buffer,
            voiceFile.originalname,
            userLanguage
          );
          console.log(`[CHAT] ✅ Transcription tamamlandı: ${transcription.substring(0, 100)}${transcription.length > 100 ? '...' : ''}`);
        } catch (transcriptionError) {
          console.error(`[CHAT] ❌ Transcription hatası:`, transcriptionError.message);
          console.warn(`[CHAT] ⚠️ Transcription başarısız, ancak işlem devam ediyor...`);
        }

        // Transcription'ı voiceMessageContent olarak kaydet (ChatService.sendMessage'a gönderilecek)
        // Bu değişken aşağıda ChatService.sendMessage çağrısında kullanılacak
        if (transcription) {
          // Transcription'ı req objesine ekle ki aşağıda kullanabilelim
          req.voiceMessageTranscription = transcription;
          console.log(`[CHAT] 📝 Transcription voiceMessageContent olarak kaydedilecek`);
        }
      }
    } else {
      // JSON request (normal message or URL-based file/voice)
      const { consultantId: cId, message: msg, isFile, fileURL: fURL, isVoiceMessage, voiceURL: vURL } = req.body;

      consultantId = cId;
      message = msg;
      isFileMessage = isFile === true;
      isVoiceMsg = isVoiceMessage === true;
      fileURL = fURL;
      voiceURL = vURL;

      // Validation
      if (!consultantId || isNaN(consultantId)) {
        return res.status(400).json({
          success: false,
          error: 'consultantId is required and must be a number'
        });
      }

      // Validate that isFile and isVoiceMessage are not both true
      if (isFileMessage && isVoiceMsg) {
        return res.status(400).json({
          success: false,
          error: 'Message cannot be both a file and a voice message'
        });
      }

      // Validate message (required for normal messages, optional for file/voice messages)
      if (!isFileMessage && !isVoiceMsg && (!message || typeof message !== 'string' || message.trim().length === 0)) {
        return res.status(400).json({
          success: false,
          error: 'message is required and must be a non-empty string for normal messages'
        });
      }

      // Validate fileURL if isFile is true
      if (isFileMessage && (!fileURL || typeof fileURL !== 'string' || fileURL.trim().length === 0)) {
        return res.status(400).json({
          success: false,
          error: 'fileURL is required when isFile is true'
        });
      }

      // Validate voiceURL if isVoiceMessage is true
      if (isVoiceMsg && (!voiceURL || typeof voiceURL !== 'string' || voiceURL.trim().length === 0)) {
        return res.status(400).json({
          success: false,
          error: 'voiceURL is required when isVoiceMessage is true'
        });
      }
    }

    // Get content fields from request body (for AI-analyzed content)
    const imageContent = req.body.imageContent || null;
    let voiceMessageContent = req.body.voiceMessageContent || null;
    
    // Eğer voice file gönderildiyse ve transcription yapıldıysa, voiceMessageContent olarak kullan
    // (Transcription yukarıda yapıldı ve req.voiceMessageTranscription'a eklendi)
    if (isVoiceMsg && req.voiceMessageTranscription) {
      voiceMessageContent = req.voiceMessageTranscription;
      console.log(`[CHAT] 📝 Transcription voiceMessageContent olarak kullanılıyor: ${voiceMessageContent.substring(0, 50)}...`);
    }

    // Send message
    const result = await ChatService.sendMessage(
      userId,
      parseInt(consultantId),
      message ? message.trim() : '',
      isFileMessage,
      isFileMessage ? fileURL : null,
      isVoiceMsg,
      isVoiceMsg ? voiceURL : null,
      imageContent,
      voiceMessageContent
    );

    res.status(200).json({
      success: true,
      data: {
        chat: result.chat.toFlutterFormat(),
        message: result.message.toFlutterFormat()
      },
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error sending message:', error);
    next(error);
  }
});

/**
 * @route GET /chats
 * @desc Get all chats for the authenticated user
 * @header Authorization: Bearer <token>
 * @query {number} limit - Limit number of results (default: 100)
 * @query {number} offset - Offset for pagination (default: 0)
 * @query {string} orderBy - Order by field (default: last_message_date DESC)
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const orderBy = req.query.orderBy || 'last_message_date DESC, created_at DESC';

    const chats = await ChatService.getUserChats(userId, {
      limit,
      offset,
      orderBy
    });

    res.status(200).json({
      success: true,
      data: {
        chats: chats.map(c => c.toFlutterFormat()),
        count: chats.length
      }
    });
  } catch (error) {
    console.error('Error getting user chats:', error);
    next(error);
  }
});

/**
 * @route GET /chats/:chatId
 * @desc Get chat by ID
 * @header Authorization: Bearer <token>
 * @param {number} chatId - Chat ID
 */
router.get('/:chatId', authenticate, async (req, res, next) => {
  try {
    const userId = req.userId;
    const { chatId } = req.params;

    if (!chatId || isNaN(chatId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid chat ID'
      });
    }

    const chat = await ChatService.getChatById(parseInt(chatId), userId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        chat: chat.toFlutterFormat()
      }
    });
  } catch (error) {
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }
    console.error('Error getting chat:', error);
    next(error);
  }
});

/**
 * @route GET /chats/consultant/:consultantId/messages
 * @desc Get messages for a consultant (by consultant ID)
 * @header Authorization: Bearer <token>
 * @param {number} consultantId - Consultant ID
 * @query {number} limit - Limit number of results (default: 100)
 * @query {number} offset - Offset for pagination (default: 0)
 * @query {string} orderBy - Order by field (default: sent_time ASC)
 */
router.get('/consultant/:consultantId/messages', authenticate, async (req, res, next) => {
  try {
    const userId = req.userId;
    const { consultantId } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const orderBy = req.query.orderBy || 'sent_time ASC, created_at ASC';

    if (!consultantId || isNaN(consultantId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid consultant ID'
      });
    }

    const messages = await ChatService.getMessagesByConsultant(parseInt(consultantId), userId, {
      limit,
      offset,
      orderBy
    });

    res.status(200).json({
      success: true,
      data: {
        messages: messages.map(m => m.toFlutterFormat()),
        count: messages.length,
        consultantId: parseInt(consultantId)
      }
    });
  } catch (error) {
    console.error('Error getting messages by consultant:', error);
    next(error);
  }
});

/**
 * @route GET /chats/:chatId/messages
 * @desc Get messages for a chat
 * @header Authorization: Bearer <token>
 * @param {number} chatId - Chat ID
 * @query {number} limit - Limit number of results (default: 100)
 * @query {number} offset - Offset for pagination (default: 0)
 * @query {string} orderBy - Order by field (default: sent_time ASC)
 */
router.get('/:chatId/messages', authenticate, async (req, res, next) => {
  try {
    const userId = req.userId;
    const { chatId } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const orderBy = req.query.orderBy || 'sent_time ASC, created_at ASC';

    if (!chatId || isNaN(chatId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid chat ID'
      });
    }

    const messages = await ChatService.getChatMessages(parseInt(chatId), userId, {
      limit,
      offset,
      orderBy
    });

    res.status(200).json({
      success: true,
      data: {
        messages: messages.map(m => m.toFlutterFormat()),
        count: messages.length,
        chatId: parseInt(chatId)
      }
    });
  } catch (error) {
    if (error.message.includes('Unauthorized') || error.message.includes('not found')) {
      return res.status(error.message.includes('Unauthorized') ? 403 : 404).json({
        success: false,
        error: error.message
      });
    }
    console.error('Error getting chat messages:', error);
    next(error);
  }
});

module.exports = router;


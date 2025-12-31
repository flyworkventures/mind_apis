/**
 * Profile Completion Validation Middleware
 * Profil tamamlama için request validation
 */

const validateProfileCompletion = (req, res, next) => {
  const { body } = req;
  const errors = [];

  // Username validation - Boşluk ve özel karakterlere izin ver
  if (body.username !== undefined) {
    if (!body.username || typeof body.username !== 'string') {
      errors.push('Username must be a non-empty string');
    } else if (body.username.length < 1) {
      errors.push('Username must be at least 1 character long');
    } else if (body.username.length > 255) {
      errors.push('Username must be less than 255 characters');
    }
    // Boşluk ve özel karakterlere izin ver (örn: "Ahmet Taha Tokmak")
    // Unique kontrolü yok, herkes istediği ismi kullanabilir
  }

  // Gender validation
  if (body.gender !== undefined) {
    if (!['male', 'female', 'unknown'].includes(body.gender)) {
      errors.push('Gender must be one of: male, female, unknown');
    }
  }

  // Native language validation
  if (body.nativeLang !== undefined && body.nativeLang !== null) {
    if (typeof body.nativeLang !== 'string' || body.nativeLang.length > 10) {
      errors.push('Native language must be a string with max 10 characters (e.g., tr, en)');
    }
  }

  // AnswerData validation
  if (body.answerData !== undefined && body.answerData !== null) {
    if (typeof body.answerData !== 'object') {
      errors.push('answerData must be an object');
    } else {
      // QuestionAnswers structure validation
      if (body.answerData.supportArea !== undefined && typeof body.answerData.supportArea !== 'string') {
        errors.push('answerData.supportArea must be a string');
      }
      if (body.answerData.agentSpeakStyle !== undefined && typeof body.answerData.agentSpeakStyle !== 'string') {
        errors.push('answerData.agentSpeakStyle must be a string');
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors
    });
  }

  next();
};

module.exports = {
  validateProfileCompletion
};


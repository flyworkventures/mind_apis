/**
 * Consultant Model
 * Represents a consultant in the system
 */

class Consultant {
  constructor(data) {
    this.id = data.id;
    this.names = data.names || {}; // Map<String, dynamic> - names in different languages
    this.mainPrompt = data.mainPrompt || data.main_prompt || '';
    this.photoURL = data.photoURL || data.photo_url || null;
    this.voiceId = data.voiceId || data.voice_id || null;
    this.url3d = data.url3d || data['3d_url'] || null;
    this.createdDate = data.createdDate || data.created_date || data.creadtedDate || '';
    this.explanation = data.explanation || null;
    this.features = data.features || [];
    this.job = data.job || '';
  }

  /**
   * Convert to JSON format (for API responses)
   */
  toJSON() {
    return {
      id: this.id,
      names: this.names,
      mainPrompt: this.mainPrompt,
      photoURL: this.photoURL,
      voiceId: this.voiceId,
      url3d: this.url3d,
      createdDate: this.createdDate,
      explanation: this.explanation,
      features: this.features,
      job: this.job
    };
  }

  /**
   * Convert to Flutter ConsultantModel format
   */
  toFlutterFormat() {
    return {
      id: this.id,
      names: this.names,
      mainPrompt: this.mainPrompt,
      photoURL: this.photoURL,
      voiceId: this.voiceId,
      url3d: this.url3d,
      creadtedDate: this.createdDate, // Note: Flutter model has typo "creadtedDate"
      explanation: this.explanation,
      features: this.features,
      job: this.job
    };
  }
}

module.exports = Consultant;


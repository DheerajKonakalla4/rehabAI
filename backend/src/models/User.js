const mongoose = require('mongoose');
const crypto = require('crypto');

// Simple encryption setup for sensitive fields (Data Privacy)
const algorithm = 'aes-256-cbc';
const secretKey = process.env.ENCRYPTION_KEY || crypto.createHash('sha256').update('rehabAISecretKeyFallback_NeverUseInProd').digest('base64').substring(0, 32);
const iv = crypto.randomBytes(16);

function encrypt(text) {
  if (!text) return text;
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  if (!text || !text.includes(':')) return text;
  let textParts = text.split(':');
  let ivBuffer = Buffer.from(textParts.shift(), 'hex');
  let encryptedText = Buffer.from(textParts.join(':'), 'hex');
  try {
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), ivBuffer);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    return ''; // Avoid leaking ciphertext to clients
  }
}

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['patient', 'physiotherapist', 'doctor', 'caregiver'],
    required: true
  },
  uniqueId: {
    type: String,
    unique: true,
    sparse: true
  },
  age: {
    type: Number,
    min: 0,
    max: 150
  },
  phone: {
    type: String,
    set: encrypt,
    get: decrypt
  },
  profileImage: String,
  specialization: String,
  consentGiven: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Password reset fields
  passwordResetToken: String,
  passwordResetOtp: String,
  passwordResetOtpExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Generate unique ID based on role
userSchema.pre('save', async function(next) {
  if (!this.uniqueId) {
    let prefix = 'USR';
    if (this.role === 'doctor') prefix = 'DOC';
    else if (this.role === 'patient') prefix = 'PAT';
    else if (this.role === 'physiotherapist') prefix = 'PHY';
    else if (this.role === 'caregiver') prefix = 'CGV';
    
    const count = await mongoose.model('User').countDocuments({ role: this.role });
    this.uniqueId = `${prefix}-${Date.now()}-${count + 1}`;
  }
  next();
});

module.exports = mongoose.model('User', userSchema);

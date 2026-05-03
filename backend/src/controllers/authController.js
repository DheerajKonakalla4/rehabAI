const { User, PatientProfile } = require('../models');
const { generateToken, hashPassword, comparePassword } = require('../utils/auth');

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, role, age, phone } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role.toLowerCase(),
      age: age ? parseInt(age) : undefined,
      phone
    });

    // If user is a patient, create patient profile
    if (newUser.role === 'patient') {
      try {
        await PatientProfile.create({
          patientId: newUser._id
        });
      } catch (profileError) {
        console.error('Error creating patient profile:', profileError);
        // Don't fail registration if patient profile creation fails
        // The profile can be created later
      }
    }

    // Generate token
    let token;
    try {
      token = generateToken(newUser._id, newUser.role);
    } catch (tokenError) {
      console.error('Token generation error:', tokenError);
      return res.status(500).json({ message: 'Error generating authentication token' });
    }

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        age: newUser.age
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', details: messages });
    }
    
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare passwords
    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated' });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        age: user.age
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// @route   GET /api/auth/profile
// @desc    Get logged-in user profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        age: user.age,
        phone: user.phone,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile', error: error.message });
  }
};

// @route   PUT /api/auth/profile
// @desc    Update logged-in user profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, age, profileImage } = req.body;
    const userId = req.user.userId;

    const updates = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (phone) updates.phone = phone;
    if (age) updates.age = parseInt(age);
    if (profileImage) updates.profileImage = profileImage;
    updates.updatedAt = Date.now();

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        age: user.age,
        phone: user.phone,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile', error: error.message });
  }
};

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
exports.logout = async (req, res) => {
  try {
    // Token is typically managed on the client side
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error during logout', error: error.message });
  }
};

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ message: 'Please provide email address' });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User with this email not found' });
    }

    // Generate OTP (6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Save OTP to user
    user.passwordResetOtp = otp;
    user.passwordResetOtpExpires = otpExpiry;
    await user.save();

    // In production, send email using nodemailer or email service
    // For now, log the OTP (development only)
    console.log(`Password reset OTP for ${email}: ${otp}`);

    // TODO: Implement actual email sending
    // sendResetEmail(email, otp);

    res.status(200).json({ 
      message: 'OTP has been sent to your email',
      // In development only - remove in production
      ...(process.env.NODE_ENV === 'development' && { otp })
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error processing forgot password', error: error.message });
  }
};

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for password reset
// @access  Public
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({ message: 'Please provide email and OTP' });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if OTP is valid
    if (user.passwordResetOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Check if OTP is expired
    if (new Date() > user.passwordResetOtpExpires) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one' });
    }

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error verifying OTP', error: error.message });
  }
};

// @route   POST /api/auth/reset-password
// @desc    Reset password with OTP
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Validate input
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Please provide email, OTP, and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if OTP is valid
    if (user.passwordResetOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Check if OTP is expired
    if (new Date() > user.passwordResetOtpExpires) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear OTP fields
    user.password = hashedPassword;
    user.passwordResetOtp = undefined;
    user.passwordResetOtpExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error resetting password', error: error.message });
  }
};

const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

// @route   POST /api/auth/enable-mfa
// @desc    Generate MFA secret and QR code
// @access  Private
exports.enableMfa = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const secret = speakeasy.generateSecret({ length: 20, name: `RehabAI (${user.email})` });
    user.mfaSecret = secret.base32;
    await user.save();

    qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
      if (err) return res.status(500).json({ message: 'Error generating QR code' });
      res.status(200).json({ secret: secret.base32, qrCode: data_url });
    });
  } catch (error) {
    console.error('MFA enable error:', error);
    res.status(500).json({ message: 'Server error enabling MFA', error: error.message });
  }
};

// @route   POST /api/auth/verify-mfa
// @desc    Verify MFA token and enable it permanently
// @access  Private
exports.verifyMfa = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token
    });

    if (verified) {
      user.isMfaEnabled = true;
      await user.save();
      return res.status(200).json({ message: 'MFA enabled successfully' });
    } else {
      return res.status(400).json({ message: 'Invalid MFA token' });
    }
  } catch (error) {
    console.error('MFA verify error:', error);
    res.status(500).json({ message: 'Server error verifying MFA', error: error.message });
  }
};


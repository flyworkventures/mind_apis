const router = require("express").Router();
const { validateAuthRequest } = require("../middleware/validation");
const AuthService = require("../services/authService");
const UserService = require("../services/userService");
const { generateToken, decodeToken } = require("../utils/jwt");
const TokenRepository = require("../repositories/TokenRepository");

/**
 * @route POST /auth/:provider
 * @desc Authenticate user with Google, Facebook, or Apple
 * @param {string} provider - 'google', 'facebook', or 'apple'
 * @body {string} idToken - (Google) Google ID Token
 * @body {string} accessToken - (Facebook) Facebook Access Token
 * @body {string} identityToken - (Apple) Apple Identity Token (JWT)
 * @body {string} userIdentifier - (Apple) Apple User Identifier
 * @body {string} authorizationCode - (Apple, optional) Apple Authorization Code
 */
router.post("/:provider", validateAuthRequest, async (req, res, next) => {
  try {
    const { provider } = req.params;
    const { body } = req;

    let providerData;

    // Provider'a göre token verify et
    switch (provider) {
      case "google":
        if (!body.idToken) {
          return res.status(400).json({
            success: false,
            error: "idToken is required for Google authentication"
          });
        }
        providerData = await AuthService.verifyGoogleToken(body.idToken);
        break;
      case "facebook":
        if (!body.accessToken) {
          return res.status(400).json({
            success: false,
            error: "accessToken is required for Facebook authentication"
          });
        }
        providerData = await AuthService.verifyFacebookToken(body.accessToken);
        break;
      case "apple":
        if (!body.identityToken && !body.userIdentifier) {
          return res.status(400).json({
            success: false,
            error: "identityToken or userIdentifier is required for Apple authentication"
          });
        }
        providerData = await AuthService.verifyAppleToken(
          body.identityToken,
          body.userIdentifier
        );
        break;
      default:
        return res.status(400).json({
          success: false,
          error: "Invalid provider. Must be one of: google, facebook, apple"
        });
    }

    // Validate provider data
    if (!providerData || !providerData.id) {
      return res.status(401).json({
        success: false,
        error: "Failed to verify authentication token"
      });
    }

    // Find or create user in database
    const user = await UserService.findOrCreateUser(providerData, provider);

    if (!user) {
      return res.status(500).json({
        success: false,
        error: "Failed to create or retrieve user"
      });
    }

    // Generate JWT token
    const token = generateToken(user.id, {
      expiresIn: '7d'
    });

    // Decode token to get expiration date
    const decoded = decodeToken(token);
    const expiresAt = new Date(decoded.exp * 1000); // Convert to Date

    // Save token to database (Stateful JWT - required)
    await TokenRepository.create(user.id, token, expiresAt, {
      deviceInfo: req.headers['user-agent'] || null,
      ipAddress: req.ip || req.connection.remoteAddress || null
    });

    // Log successful authentication
    console.log(`✅ User authenticated: ${user.id} (${provider})`);

    res.status(200).json({
      success: true,
      data: {
        user: user.toJSON(),
        token: token
      },
      message: user.accountCreatedDate === new Date(user.accountCreatedDate).toISOString() 
        ? "User authenticated successfully" 
        : "New user created and authenticated successfully"
    });
  } catch (error) {
    console.error('Authentication error:', error);
    next(error);
  }
});

/**
 * @route GET /auth/verify
 * @desc Verify authentication token (JWT) - Stateful JWT with database check
 * @header Authorization: Bearer <token>
 */
router.get("/verify", async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided. Please provide a valid JWT token in Authorization header.'
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token is required'
      });
    }

    // Verify JWT signature
    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token has expired'
        });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Invalid token'
        });
      }
      throw error;
    }

    // Check if token exists in database and is not revoked (Stateful JWT)
    const tokenValid = await TokenRepository.isValid(token);
    if (!tokenValid) {
      return res.status(401).json({
        success: false,
        error: 'Token has been revoked or does not exist in database'
      });
    }

    // Get user from database
    const user = await UserService.getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: user.toJSON(),
        valid: true
      },
      message: "Token is valid"
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /auth/me
 * @desc Get current authenticated user
 * @header Authorization: Bearer <token>
 */
router.get("/me", require("../middleware/auth").authenticate, async (req, res, next) => {
  try {
    const user = req.user;
    
    res.status(200).json({
      success: true,
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /auth/profile
 * @desc Complete user profile (username, answerData, etc.)
 * @header Authorization: Bearer <token>
 * @body {string} username - Username (required for first time)
 * @body {string} nativeLang - Native language code (optional)
 * @body {string} gender - Gender: male, female, unknown (optional)
 * @body {Object} answerData - QuestionAnswers object (optional)
 *   - {any} avaibleDays - Available days
 *   - {any} avaibleHours - Available hours
 *   - {string} supportArea - Support area
 *   - {string} agentSpeakStyle - Agent speak style
 */
router.put("/profile", 
  require("../middleware/auth").authenticate,
  require("../middleware/profileValidation").validateProfileCompletion,
  async (req, res, next) => {
    try {
      const userId = req.userId;
      const { username, nativeLang, gender, answerData } = req.body;

      // Prepare update data
      const updateData = {};
      
      if (username !== undefined) {
        updateData.username = username;
      }
      if (nativeLang !== undefined) {
        updateData.nativeLang = nativeLang;
      }
      if (gender !== undefined) {
        updateData.gender = gender;
      }
      if (answerData !== undefined) {
        updateData.answerData = answerData;
      }

      // Update user profile
      const updatedUser = await UserService.updateUser(userId, updateData);

      res.status(200).json({
        success: true,
        data: {
          user: updatedUser.toJSON()
        },
        message: "Profile updated successfully"
      });
    } catch (error) {
      console.error('Profile update error:', error);
      next(error);
    }
  }
);

/**
 * @route POST /auth/logout
 * @desc Logout user - Revoke current token
 * @header Authorization: Bearer <token>
 */
router.post("/logout", require("../middleware/auth").authenticate, async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      // Revoke token in database
      await TokenRepository.revoke(token);
    }

    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error('Logout error:', error);
    next(error);
  }
});

/**
 * @route POST /auth/logout-all
 * @desc Logout from all devices - Revoke all tokens for user
 * @header Authorization: Bearer <token>
 */
router.post("/logout-all", require("../middleware/auth").authenticate, async (req, res, next) => {
  try {
    const userId = req.userId;
    
    // Revoke all tokens for user
    const revokedCount = await TokenRepository.revokeAll(userId);

    res.status(200).json({
      success: true,
      message: `Logged out from ${revokedCount} device(s) successfully`
    });
  } catch (error) {
    console.error('Logout all error:', error);
    next(error);
  }
});

/**
 * @route DELETE /auth/account
 * @desc Delete user account permanently
 * @header Authorization: Bearer <token>
 * 
 * This endpoint:
 * - Deletes all user data (messages, chats, appointments, moods, etc.)
 * - Revokes all tokens
 * - Soft deletes the user account
 */
router.delete("/account", require("../middleware/auth").authenticate, async (req, res, next) => {
  try {
    const userId = req.userId;
    
    // Delete all user data
    await UserService.deleteUserAccount(userId);
    
    // Revoke all tokens for user
    await TokenRepository.revokeAll(userId);
    
    res.status(200).json({
      success: true,
      message: "Account deleted successfully"
    });
  } catch (error) {
    console.error('Delete account error:', error);
    next(error);
  }
});

module.exports = router;
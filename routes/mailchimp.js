/**
 * Mailchimp Webhook Routes
 * 
 * Handles incoming webhook events from Mailchimp.
 * This router:
 * - Validates webhook authenticity
 * - Processes subscriber events
 * - Triggers Bitrix24 lead creation
 * - Manages error responses
 */

const express = require('express');
const crypto = require('crypto');
const logger = require('../utils/logger');
const bitrixService = require('../services/bitrixService');

const router = express.Router();

/**
 * Validate Mailchimp webhook signature
 * 
 * This ensures that the webhook request actually came from Mailchimp
 * using the webhook key provided in your Mailchimp dashboard.
 * 
 * @param {string} body - Raw request body
 * @param {string} signature - X-Mailchimp-Hook-Signature header value
 * @returns {boolean} True if signature is valid
 */
function validateWebhookSignature(body, signature) {
  const webhookKey = process.env.MAILCHIMP_WEBHOOK_KEY;
  
  if (!webhookKey) {
    logger.warn('MAILCHIMP_WEBHOOK_KEY not configured - skipping signature validation');
    return true;
  }

  try {
    const hash = crypto
      .createHmac('sha256', webhookKey)
      .update(body)
      .digest('base64');

    // Mailchimp signature format is: sha256=<base64hash>
    const expectedSignature = `sha256=${hash}`;
    
    return signature === expectedSignature;
  } catch (error) {
    logger.error('Error validating webhook signature', error.message);
    return false;
  }
}

/**
 * Extract subscriber information from Mailchimp webhook payload
 * 
 * @param {Object} mailchimpData - Mailchimp webhook payload
 * @returns {Object} Extracted and normalized subscriber data
 */
function extractSubscriberData(mailchimpData) {
  const data = mailchimpData.data || {};
  const mergeFields = data.merges || {};

  return {
    email: data.email || '',
    firstName: mergeFields.FNAME || '',
    lastName: mergeFields.LNAME || '',
    phone: mergeFields.PHONE || '',
    listId: data.list_id || '',
    timestamp: new Date().toISOString()
  };
}

/**
 * Validate extracted subscriber data
 * 
 * @param {Object} subscriberData - Subscriber data to validate
 * @returns {Object} Validation result {valid: boolean, errors: array}
 */
function validateSubscriberData(subscriberData) {
  const errors = [];

  if (!subscriberData.email || subscriberData.email.trim() === '') {
    errors.push('Email is required');
  }

  if (!subscriberData.firstName || subscriberData.firstName.trim() === '') {
    errors.push('First name (FNAME) is required');
  }

  if (!subscriberData.lastName || subscriberData.lastName.trim() === '') {
    errors.push('Last name (LNAME) is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * POST /webhooks/mailchimp
 * 
 * Webhook endpoint for Mailchimp subscribe events
 * 
 * Expected payload:
 * {
 *   "type": "subscribe",
 *   "fired_at": "2023-01-01T12:00:00Z",
 *   "data": {
 *     "email": "user@example.com",
 *     "list_id": "abc123",
 *     "merges": {
 *       "FNAME": "John",
 *       "LNAME": "Doe",
 *       "PHONE": "+1234567890"
 *     }
 *   }
 * }
 */
const handleMailchimpWebhook = async (req, res) => {
  try {
    // Get the raw body for signature validation
    let rawBody = '';
    
    // In Express with body parser, we need to reconstruct raw body
    // For proper implementation, consider using express-raw-body or bodyParser.raw()
    rawBody = JSON.stringify(req.body);

    // Log incoming webhook
    logger.info('Mailchimp webhook received', `Type: ${req.body.type}`);

    // Validate webhook signature
    const signature = req.headers['x-mailchimp-hook-signature'];
    if (process.env.VALIDATE_MAILCHIMP_SIGNATURE === 'true' && signature) {
      if (!validateWebhookSignature(rawBody, signature)) {
        logger.warn('Invalid Mailchimp webhook signature');
        return res.status(401).json({
          error: 'Invalid webhook signature',
          success: false
        });
      }
      logger.debug('Webhook signature validated');
    }

    // Check webhook type
    const webhookType = req.body.type;
    if (webhookType !== 'subscribe') {
      logger.debug(`Ignoring webhook type: ${webhookType} - only 'subscribe' events are processed`);
      return res.status(200).json({
        message: 'Webhook type not processed',
        type: webhookType,
        success: true
      });
    }

    // Extract subscriber information
    const subscriberData = extractSubscriberData(req.body);
    logger.debug(`Extracted subscriber data: ${subscriberData.email}`);

    // Validate extracted data
    const validation = validateSubscriberData(subscriberData);
    if (!validation.valid) {
      logger.warn(`Invalid subscriber data: ${validation.errors.join(', ')}`);
      return res.status(400).json({
        error: 'Invalid subscriber data',
        details: validation.errors,
        success: false
      });
    }

    // Create lead in Bitrix24
    logger.info(`Processing subscription for ${subscriberData.email}`);
    const bitrixResult = await bitrixService.createLead(subscriberData);

    if (bitrixResult.success) {
      logger.success(
        `Subscriber processed successfully`,
        `Email: ${subscriberData.email}, Lead ID: ${bitrixResult.leadId}`
      );

      return res.status(200).json({
        message: 'Subscriber processed successfully',
        email: subscriberData.email,
        leadId: bitrixResult.leadId,
        success: true
      });
    } else {
      // Handle duplicate or other non-critical errors
      if (bitrixResult.isDuplicate) {
        return res.status(200).json({
          message: 'Lead already exists',
          email: subscriberData.email,
          leadId: bitrixResult.leadId,
          success: true,
          isDuplicate: true
        });
      }

      logger.error(
        `Failed to create lead for ${subscriberData.email}`,
        bitrixResult.error
      );

      return res.status(400).json({
        error: 'Failed to create lead in Bitrix24',
        details: bitrixResult.error,
        success: false
      });
    }
  } catch (error) {
    logger.error('Error processing Mailchimp webhook', error.message);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      success: false
    });
  }
};

router.post('/mailchimp', handleMailchimpWebhook);
router.post('/', handleMailchimpWebhook);

/**
 * GET /webhooks/mailchimp/health
 * 
 * Health check endpoint for webhook subscription
 * Verifies that the webhook endpoint is accessible
 */
router.get('/mailchimp/health', async (req, res) => {
  try {
    const bitrixHealth = await bitrixService.healthCheck();

    res.status(200).json({
      status: 'ok',
      mailchimpWebhook: 'connected',
      bitrix24: bitrixHealth ? 'connected' : 'unreachable',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Health check failed', error.message);

    res.status(503).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /webhooks/mailchimp/test
 * 
 * Test endpoint to verify webhook is working
 * Use this to test without actual Mailchimp events
 * 
 * Example payload:
 * {
 *   "type": "subscribe",
 *   "data": {
 *     "email": "test@example.com",
 *     "merges": {
 *       "FNAME": "John",
 *       "LNAME": "Doe"
 *     }
 *   }
 * }
 */
router.post('/mailchimp/test', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Test endpoint is not available in production',
        success: false
      });
    }

    logger.info('Test webhook received');

    // Extract and validate
    const subscriberData = extractSubscriberData(req.body);
    const validation = validateSubscriberData(subscriberData);

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid test data',
        details: validation.errors,
        success: false
      });
    }

    // Create lead
    const result = await bitrixService.createLead(subscriberData);

    return res.status(result.success ? 200 : 400).json({
      ...result,
      message: result.success ? 'Test successful' : 'Test failed'
    });
  } catch (error) {
    logger.error('Test webhook error', error.message);

    res.status(500).json({
      error: 'Test failed',
      message: error.message,
      success: false
    });
  }
});

module.exports = router;

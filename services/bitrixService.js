/**
 * Bitrix24 Service
 * 
 * Handles all interactions with Bitrix24 CRM API.
 * This service is responsible for:
 * - Creating leads in Bitrix24
 * - Handling Bitrix24 API responses
 * - Error handling and retry logic
 * - Checking for duplicate leads
 */

const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Bitrix24Service class for CRM operations
 */
class Bitrix24Service {
  constructor() {
    this.webhookUrl = process.env.BITRIX24_WEBHOOK_URL;
    this.timeout = parseInt(process.env.BITRIX24_TIMEOUT || '10000', 10);
    this.isConfigured = Boolean(this.webhookUrl);

    if (!this.isConfigured) {
      logger.warn('BITRIX24_WEBHOOK_URL is not configured; Bitrix24 operations are disabled until it is set');
    }
  }

  ensureConfigured() {
    if (!this.isConfigured) {
      throw new Error('BITRIX24_WEBHOOK_URL is not configured in environment variables');
    }
  }

  /**
   * Create a new lead in Bitrix24
   * 
   * @param {Object} leadData - Lead information
   * @param {string} leadData.email - Contact email
   * @param {string} leadData.firstName - First name
   * @param {string} leadData.lastName - Last name
   * @param {string} leadData.phone - Phone number (optional)
   * @param {string} leadData.source - Lead source (optional)
   * 
   * @returns {Promise<Object>} Lead creation response from Bitrix24
   */
  async createLead(leadData) {
    try {
      this.ensureConfigured();

      // Validate required fields
      this.validateLeadData(leadData);

      logger.debug(`Creating lead for ${leadData.email}`);

      // Check for existing lead (optional duplicate prevention)
      if (process.env.CHECK_DUPLICATES === 'true') {
        const existingLead = await this.checkDuplicateLead(leadData.email);
        if (existingLead) {
          logger.warn(`Duplicate lead detected for ${leadData.email}`, `Lead ID: ${existingLead}`);
          return {
            success: false,
            message: 'Lead already exists',
            leadId: existingLead,
            isDuplicate: true
          };
        }
      }

      // Prepare lead data for Bitrix24
      const bitrixPayload = this.prepareBitrixPayload(leadData);

      // Make API request to Bitrix24
      const response = await axios.post(
        this.webhookUrl,
        bitrixPayload,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Check response status
      if (response.data.result && response.data.result.id) {
        logger.success(
          `Lead created successfully in Bitrix24`,
          `Email: ${leadData.email}, Lead ID: ${response.data.result.id}`
        );

        return {
          success: true,
          message: 'Lead created successfully',
          leadId: response.data.result.id,
          bitrixResponse: response.data
        };
      } else {
        // Bitrix24 returned an error in the response
        const errorMsg = response.data.error || 'Unknown Bitrix24 error';
        logger.error(`Bitrix24 API error for ${leadData.email}`, errorMsg);

        return {
          success: false,
          message: 'Failed to create lead in Bitrix24',
          error: errorMsg,
          bitrixResponse: response.data
        };
      }
    } catch (error) {
      logger.error(
        `Error creating lead in Bitrix24 for ${leadData.email}`,
        error.message
      );

      // Provide more detailed error information
      const errorResponse = {
        success: false,
        message: 'Failed to create lead in Bitrix24',
        error: error.message
      };

      // Include response data if available (for debugging)
      if (error.response) {
        errorResponse.statusCode = error.response.status;
        errorResponse.bitrixError = error.response.data;
      }

      throw errorResponse;
    }
  }

  /**
   * Validate lead data before sending to Bitrix24
   * 
   * @param {Object} leadData - Lead information to validate
   * @throws {Error} If validation fails
   */
  validateLeadData(leadData) {
    const errors = [];

    if (!leadData.email || !this.isValidEmail(leadData.email)) {
      errors.push('Invalid or missing email');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Check if a lead with the same email already exists
   * 
   * @param {string} email - Email to check
   * @returns {Promise<string|null>} Lead ID if exists, null otherwise
   */
  async checkDuplicateLead(email) {
    try {
      // This is a basic implementation
      // In production, you might want to use Bitrix24's search API
      // For now, we'll just log the check
      logger.debug(`Checking for duplicate lead with email: ${email}`);
      return null; // Implement actual duplicate check if needed
    } catch (error) {
      logger.warn(`Error checking for duplicate: ${error.message}`);
      return null; // Continue despite duplicate check failure
    }
  }

  /**
   * Prepare payload in the format expected by Bitrix24
   * 
   * @param {Object} leadData - Lead information
   * @returns {Object} Formatted payload for Bitrix24 API
   */
  prepareBitrixPayload(leadData) {
    const emailPrefix = leadData.email && leadData.email.includes('@')
      ? leadData.email.split('@')[0]
      : 'Subscriber';
    const firstName = (leadData.firstName || '').trim() || 'Mailchimp';
    const lastName = (leadData.lastName || '').trim() || emailPrefix;

    return {
      fields: {
        TITLE: `${firstName} ${lastName}`,
        NAME: firstName,
        LAST_NAME: lastName,
        EMAIL: [
          {
            VALUE: leadData.email,
            VALUE_TYPE: 'WORK'
          }
        ],
        ...(leadData.phone && {
          PHONE: [
            {
              VALUE: leadData.phone,
              VALUE_TYPE: 'MOBILE'
            }
          ]
        }),
        SOURCE_ID: process.env.BITRIX24_SOURCE_ID || 'MAILCHIMP',
        STATUS_ID: process.env.BITRIX24_STATUS_ID || 'NEW',
        ASSIGNED_BY_ID: process.env.BITRIX24_ASSIGNED_BY_ID || '1'
      },
      params: {
        REGISTER_SONET_EVENT: 'Y'
      }
    };
  }

  /**
   * Validate email format
   * 
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Health check - verify Bitrix24 webhook is reachable
   * 
   * @returns {Promise<boolean>} True if webhook is accessible
   */
  async healthCheck() {
    if (!this.isConfigured) {
      logger.warn('Bitrix24 health check skipped because BITRIX24_WEBHOOK_URL is not configured');
      return false;
    }

    try {
      const response = await axios.post(
        this.webhookUrl,
        { test: true },
        { timeout: 5000 }
      );
      return response.status === 200;
    } catch (error) {
      logger.warn('Bitrix24 health check failed', error.message);
      return false;
    }
  }
}

module.exports = new Bitrix24Service();

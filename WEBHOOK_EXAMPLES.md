# Webhook Examples

Complete real-world examples of Mailchimp webhook payloads and expected responses.

## Table of Contents

1. [Subscribe Event](#subscribe-event)
2. [With Full Details](#with-full-details)
3. [Error Cases](#error-cases)
4. [Success Response](#success-response)

---

## Subscribe Event

### Basic Subscribe Webhook (Minimal)

This is the minimum payload from Mailchimp when someone subscribes:

```json
{
  "type": "subscribe",
  "fired_at": "2024-02-23T12:00:00Z",
  "data": {
    "id": "edb6d7d6d9",
    "email": "john.doe@example.com",
    "email_type": "html",
    "ip_opt": "1.2.3.4",
    "subscribing_ip": "1.2.3.4",
    "timestamp": "2024-02-23T12:00:00Z",
    "list_id": "abc123def456",
    "status": "subscribed",
    "web_id": "123456789",
    "merges": {
      "EMAIL": "john.doe@example.com",
      "FNAME": "John",
      "LNAME": "Doe"
    }
  }
}
```

### Request Headers

```
POST /webhooks/mailchimp HTTP/1.1
Host: api.yourdomain.com
Content-Type: application/json
Content-Length: 645
X-Mailchimp-Hook-Signature: sha256=AbCdEf1234567890AbCdEf1234567890
User-Agent: MailChimp Webhooks v1
```

### Server Response

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Subscriber processed successfully",
  "email": "john.doe@example.com",
  "leadId": 12345
}
```

---

## With Full Details

### Complete Subscribe Webhook (All Fields)

This includes optional merge fields and additional data:

```json
{
  "type": "subscribe",
  "fired_at": "2024-02-23T12:00:00Z",
  "data": {
    "id": "edb6d7d6d9",
    "email": "jane.smith@company.com",
    "email_type": "html",
    "ip_opt": "192.168.1.100",
    "subscribing_ip": "192.168.1.100",
    "timestamp": "2024-02-23T12:00:00Z",
    "list_id": "abc123def456",
    "status": "subscribed",
    "web_id": "987654321",
    "merges": {
      "EMAIL": "jane.smith@company.com",
      "FNAME": "Jane",
      "LNAME": "Smith",
      "PHONE": "+44 (0)20 1234 5678",
      "ADDRESS": "123 Business St",
      "CITY": "London",
      "STATE": "England",
      "ZIP": "EC1A 1AA",
      "COUNTRY": "United Kingdom",
      "COMPANY": "Acme Corporation",
      "MMERGE5": "Custom Field Value"
    },
    "interests": {
      "abc123": true,
      "def456": false,
      "ghi789": true
    },
    "language": "en"
  }
}
```

### Expected Lead in Bitrix24

After webhook is processed, this data is sent to Bitrix24:

```json
POST https://company.bitrix24.com/rest/1/WEBHOOK_ID/crm.lead.add.json

{
  "fields": {
    "TITLE": "Jane Smith",
    "NAME": "Jane",
    "LAST_NAME": "Smith",
    "EMAIL": [
      {
        "VALUE": "jane.smith@company.com",
        "VALUE_TYPE": "WORK"
      }
    ],
    "PHONE": [
      {
        "VALUE": "+44 (0)20 1234 5678",
        "VALUE_TYPE": "MOBILE"
      }
    ],
    "SOURCE_ID": "MAILCHIMP",
    "STATUS_ID": "NEW",
    "ASSIGNED_BY_ID": "1"
  },
  "params": {
    "REGISTER_SONET_EVENT": "Y"
  }
}
```

### Bitrix24 Response

```json
{
  "result": {
    "id": "12345"
  }
}
```

---

## Error Cases

### Invalid Email

**Webhook from Mailchimp:**
```json
{
  "type": "subscribe",
  "data": {
    "email": "not-a-valid-email",
    "merges": {
      "FNAME": "John",
      "LNAME": "Doe"
    }
  }
}
```

**Server Response (400 Bad Request):**
```json
{
  "error": "Invalid subscriber data",
  "details": ["Invalid or missing email"],
  "success": false
}
```

### Missing Required Field

**Webhook from Mailchimp:**
```json
{
  "type": "subscribe",
  "data": {
    "email": "john@example.com",
    "merges": {
      "LNAME": "Doe"
      // Missing FNAME
    }
  }
}
```

**Server Response (400 Bad Request):**
```json
{
  "error": "Invalid subscriber data",
  "details": ["First name (FNAME) is required"],
  "success": false
}
```

### Bitrix24 Unavailable

**Webhook from Mailchimp:** (Valid data)

**Server Response (400 Bad Request):**
```json
{
  "error": "Failed to create lead in Bitrix24",
  "details": "Connection refused - Bitrix24 unavailable",
  "success": false
}
```

### Wrong Event Type

**Webhook from Mailchimp:**
```json
{
  "type": "unsubscribe",
  "data": {
    "email": "john@example.com",
    "merges": {
      "FNAME": "John",
      "LNAME": "Doe"
    }
  }
}
```

**Server Response (200 OK):**
```json
{
  "message": "Webhook type not processed",
  "type": "unsubscribe",
  "success": true
}
```

### Duplicate Lead (When Enabled)

**Webhook from Mailchimp:** (Email already exists in Bitrix24)

**Server Response (200 OK):**
```json
{
  "message": "Lead already exists",
  "email": "john@example.com",
  "leadId": 12345,
  "success": true,
  "isDuplicate": true
}
```

---

## Success Response

### Complete Success Response

**Webhook Received and Processed:**
```json
{
  "success": true,
  "message": "Subscriber processed successfully",
  "email": "john.doe@example.com",
  "leadId": "12345"
}
```

---

## cURL Examples

### Test Basic Webhook

```bash
curl -X POST http://localhost:3000/webhooks/mailchimp/test \
  -H "Content-Type: application/json" \
  -d '{
    "type": "subscribe",
    "data": {
      "email": "test@example.com",
      "merges": {
        "FNAME": "John",
        "LNAME": "Doe"
      }
    }
  }'
```

### Test with Phone

```bash
curl -X POST http://localhost:3000/webhooks/mailchimp/test \
  -H "Content-Type: application/json" \
  -d '{
    "type": "subscribe",
    "data": {
      "email": "jane@company.com",
      "merges": {
        "FNAME": "Jane",
        "LNAME": "Smith",
        "PHONE": "+44201234567"
      }
    }
  }'
```

### Test with Signature (Production)

```bash
# Generate signature (replace KEY with your webhook key)
PAYLOAD='{"type":"subscribe","data":{"email":"test@example.com","merges":{"FNAME":"John","LNAME":"Doe"}}}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "YOUR_WEBHOOK_KEY" -binary | base64)

curl -X POST https://api.yourdomain.com/webhooks/mailchimp \
  -H "Content-Type: application/json" \
  -H "X-Mailchimp-Hook-Signature: sha256=$SIGNATURE" \
  -d "$PAYLOAD"
```

### Check Health

```bash
curl http://localhost:3000/health
```

### Check Webhook Health

```bash
curl http://localhost:3000/webhooks/mailchimp/health
```

---

## Postman Examples

### Import Collection

All examples below are included in `postman-collection.json`

**Steps:**
1. Open Postman
2. Click **Import**
3. Select `postman-collection.json`
4. Collection is imported with all examples

### Run Examples

1. **Health Check**
   - Click `GET /health`
   - Click **Send**

2. **Test Lead Creation**
   - Click `POST /webhooks/mailchimp/test`
   - Edit **Body** with your data
   - Click **Send**

3. **Error Cases**
   - Select error case from collection
   - Click **Send** to see error handling

---

## Real-World Scenario

### Subscriber Signs Up in Mailchimp

1. **User fills form** with:
   - Email: user@example.com
   - First Name: John
   - Last Name: Doe
   - Phone: +1-555-123-4567

2. **Mailchimp sends webhook**:
```json
{
  "type": "subscribe",
  "fired_at": "2024-02-23T12:00:00Z",
  "data": {
    "email": "user@example.com",
    "list_id": "abc123def456",
    "merges": {
      "FNAME": "John",
      "LNAME": "Doe",
      "PHONE": "+1-555-123-4567"
    }
  }
}
```

3. **Your server**:
   - Receives webhook
   - Validates data
   - Sends to Bitrix24

4. **Bitrix24 receives**:
```json
{
  "fields": {
    "TITLE": "John Doe",
    "NAME": "John",
    "LAST_NAME": "Doe",
    "EMAIL": [{"VALUE": "user@example.com", "VALUE_TYPE": "WORK"}],
    "PHONE": [{"VALUE": "+1-555-123-4567", "VALUE_TYPE": "MOBILE"}],
    "SOURCE_ID": "MAILCHIMP",
    "STATUS_ID": "NEW",
    "ASSIGNED_BY_ID": "1"
  }
}
```

5. **Result**:
   - New lead created in Bitrix24
   - Lead assigned to user #1
   - Status set to "NEW"
   - Ready for sales team

6. **Response to Mailchimp**:
```json
{
  "success": true,
  "message": "Subscriber processed successfully",
  "email": "user@example.com",
  "leadId": "12345"
}
```

---

## Data Mapping Reference

| Mailchimp Field | Bitrix24 Field | Type |
|---|---|---|
| `data.merges.FNAME` | `fields.NAME` | String |
| `data.merges.LNAME` | `fields.LAST_NAME` | String |
| `data.email` | `fields.EMAIL[0].VALUE` | String |
| `data.merges.PHONE` | `fields.PHONE[0].VALUE` | String |
| (computed) | `fields.TITLE` | "FirstName LastName" |
| (constant) | `fields.SOURCE_ID` | "MAILCHIMP" |
| (constant) | `fields.STATUS_ID` | "NEW" |
| (config) | `fields.ASSIGNED_BY_ID` | From `.env` |

---

## Testing Checklist

- [ ] Test basic subscribe webhook
- [ ] Test with phone number
- [ ] Test with missing email
- [ ] Test with missing FNAME
- [ ] Test with invalid email format
- [ ] Test with unsubscribe event (should be ignored)
- [ ] Test health endpoints
- [ ] Check logs are being written
- [ ] Verify leads appear in Bitrix24
- [ ] Test error responses

---

## Response HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Lead created or webhook ignored |
| 400 | Bad Request | Invalid data, missing fields |
| 401 | Unauthorized | Invalid webhook signature |
| 403 | Forbidden | Test endpoint in production |
| 500 | Server Error | Internal processing error |
| 503 | Service Unavailable | Bitrix24 unreachable |

---

**Version**: 1.0.0  
**Last Updated**: February 23, 2024

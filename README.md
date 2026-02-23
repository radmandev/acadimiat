# Mailchimp to Bitrix24 Integration

A production-ready Node.js middleware that automatically creates leads in Bitrix24 CRM when new subscribers are added to Mailchimp.

## Features

✅ **Automatic Lead Creation** - Subscribes to Mailchimp webhooks and creates leads in Bitrix24  
✅ **Webhook Validation** - Validates webhook signatures to ensure requests are from Mailchimp  
✅ **Error Handling** - Comprehensive error handling and logging  
✅ **Duplicate Prevention** - Optional duplicate lead checking  
✅ **Production Ready** - Proper logging, environment configuration, and graceful shutdown  
✅ **Health Checks** - Built-in health check endpoints  
✅ **Well Documented** - Clean, commented code with complete documentation  

## Project Structure

```
mailchamp/
├── server.js                 # Main Express server
├── routes/
│   └── mailchimp.js         # Mailchimp webhook routes
├── services/
│   └── bitrixService.js     # Bitrix24 API integration
├── utils/
│   └── logger.js            # Logging utility
├── logs/                     # Log files (created at runtime)
├── package.json             # Dependencies
├── .env.example             # Environment variables template
├── .env                     # Environment variables (create from .env.example)
└── README.md                # This file
```

## Prerequisites

- Node.js v14 or higher
- npm or yarn
- Mailchimp account with API key
- Bitrix24 account with webhook access
- ngrok or similar tool for testing locally

## Installation

### 1. Clone or Download the Project

```bash
cd /Users/emadsaeed/Downloads/mailchamp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```bash
# Development
NODE_ENV=development
PORT=3000
HOST=localhost

# Mailchimp
MAILCHIMP_API_KEY=your_api_key
MAILCHIMP_LIST_ID=your_list_id
MAILCHIMP_WEBHOOK_KEY=your_webhook_signing_key
VALIDATE_MAILCHIMP_SIGNATURE=true

# Bitrix24
BITRIX24_WEBHOOK_URL=https://mycompany.bitrix24.com/rest/1/YOUR_ID/crm.lead.add.json
BITRIX24_TIMEOUT=10000
BITRIX24_SOURCE_ID=MAILCHIMP
BITRIX24_STATUS_ID=NEW
BITRIX24_ASSIGNED_BY_ID=1

# Optional
CHECK_DUPLICATES=false
```

## Getting Your Configuration Values

### Mailchimp Configuration

#### 1. Get Your API Key

1. Log in to Mailchimp
2. Go to **Account > Extras > API keys**
3. Click **Create A Key**
4. Copy your API key and paste it in `.env` as `MAILCHIMP_API_KEY`

#### 2. Get Your List ID

1. Go to **Audience > Manage Audience**
2. Select your list
3. Click **Settings > List name and defaults**
4. Your **List ID** is shown in the URL or settings page
5. Paste it in `.env` as `MAILCHIMP_LIST_ID`

#### 3. Get Your Webhook Key

1. In Mailchimp, go to **Lists > Webhooks**
2. Click **Create Webhook** or edit existing one
3. The **webhook key** is shown in the webhook configuration
4. Paste it in `.env` as `MAILCHIMP_WEBHOOK_KEY`

### Bitrix24 Configuration

#### 1. Create an Incoming Webhook

1. Log in to Bitrix24
2. Go to **CRM > Automation > Webhooks** (or **CRM > Setup > Webhooks**)
3. Create a **New Incoming Webhook** for **crm.lead.add**
4. Copy the webhook URL
5. Paste it in `.env` as `BITRIX24_WEBHOOK_URL`

#### 2. Assign User ID (Optional)

1. In Bitrix24, find the user ID who should own the created leads
2. Default is `1` for admin user
3. Set `BITRIX24_ASSIGNED_BY_ID=your_user_id`

## Development Setup

### Run Locally

```bash
npm run dev
```

The server will start at `http://localhost:3000`

### Check Health

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-02-23T12:00:00.000Z",
  "uptime": 5.123
}
```

### View Logs

Logs are saved in the `logs/` directory:

```bash
# View today's logs
tail -f logs/2024-02-23.log

# Search for errors
grep ERROR logs/2024-02-23.log

# Search for specific email
grep "user@example.com" logs/2024-02-23.log
```

## Testing the Integration

### Option 1: Using ngrok for Local Testing

ngrok exposes your local server to the internet so Mailchimp can send webhooks.

#### 1. Install ngrok

On macOS:
```bash
brew install ngrok
```

Or download from https://ngrok.com

#### 2. Start ngrok

In a new terminal:
```bash
ngrok http 3000
```

You'll see:
```
Session Status                online
Account                       your_email@example.com
Version                       3.0.0
Region                        us (California)
Forwarding                    https://abc123.ngrok.io -> http://localhost:3000
Web Interface                 http://127.0.0.1:4040
```

Copy your ngrok URL: `https://abc123.ngrok.io`

#### 3. Configure Mailchimp Webhook

1. In Mailchimp, go to **Lists > Webhooks**
2. Create/Edit webhook
3. Set URL to: `https://abc123.ngrok.io/webhooks/mailchimp`
4. Select events: Check **List changes: Subscribe**
5. Save

#### 4. Test with Real Subscription

Add a test subscriber to your Mailchimp list and check the logs in your terminal.

### Option 2: Using the Test Endpoint (Development Only)

The test endpoint allows you to simulate a webhook without using Mailchimp:

```bash
curl -X POST http://localhost:3000/webhooks/mailchimp/test \
  -H "Content-Type: application/json" \
  -d '{
    "type": "subscribe",
    "data": {
      "email": "john.doe@example.com",
      "list_id": "abc123",
      "merges": {
        "FNAME": "John",
        "LNAME": "Doe",
        "PHONE": "+1234567890"
      }
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Test successful",
  "email": "john.doe@example.com",
  "leadId": "12345"
}
```

### Option 3: Using Postman

#### 1. Import Collection

Create a new Postman Collection with these requests:

**Request 1: Create Test Lead**

```
POST http://localhost:3000/webhooks/mailchimp/test
Content-Type: application/json

{
  "type": "subscribe",
  "data": {
    "email": "john.doe@example.com",
    "list_id": "abc123",
    "merges": {
      "FNAME": "John",
      "LNAME": "Doe",
      "PHONE": "+1234567890"
    }
  }
}
```

**Request 2: Check Health**

```
GET http://localhost:3000/health
```

**Request 3: Check Webhook Health**

```
GET http://localhost:3000/webhooks/mailchimp/health
```

## Webhook Format

The middleware expects Mailchimp webhooks in this format:

```json
{
  "type": "subscribe",
  "fired_at": "2024-02-23T12:00:00Z",
  "data": {
    "email": "john.doe@example.com",
    "list_id": "abc123",
    "merges": {
      "FNAME": "John",
      "LNAME": "Doe",
      "PHONE": "+1234567890"
    }
  }
}
```

**Required fields:**
- `type`: Must be `"subscribe"`
- `data.email`: Subscriber email
- `data.merges.FNAME`: First name
- `data.merges.LNAME`: Last name

**Optional fields:**
- `data.merges.PHONE`: Phone number

## Lead Creation in Bitrix24

The middleware creates leads with the following structure:

```json
{
  "fields": {
    "TITLE": "John Doe",
    "NAME": "John",
    "LAST_NAME": "Doe",
    "EMAIL": [
      {
        "VALUE": "john.doe@example.com",
        "VALUE_TYPE": "WORK"
      }
    ],
    "PHONE": [
      {
        "VALUE": "+1234567890",
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

## Endpoint Reference

### Health Checks

**Main Health Check**
```
GET /health
```

**Webhook Health Check**
```
GET /webhooks/mailchimp/health
```

### Webhook Endpoints

**Mailchimp Subscriber Webhook**
```
POST /webhooks/mailchimp
```

Required header:
- `X-Mailchimp-Hook-Signature`: Webhook signature (if validation enabled)

**Test Endpoint (Development Only)**
```
POST /webhooks/mailchimp/test
```

## Production Deployment

### Prerequisites

- Linux/Unix server
- Node.js installed
- PM2 or similar process manager
- SSL certificate (HTTPS required)
- Firewall configured

### Steps

#### 1. Prepare Server

```bash
# SSH into your server
ssh user@your-server.com

# Create project directory
mkdir -p /var/www/mailchamp
cd /var/www/mailchamp

# Clone/copy your project
git clone your-repo-url .
# Or: scp -r mailchamp/ user@server:/var/www/

# Install dependencies
npm install --production

# Set up environment
cp .env.example .env
# Edit .env with production values
nano .env
```

#### 2. Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the application
pm2 start server.js --name "mailchamp"

# Configure PM2 to start on reboot
pm2 startup
pm2 save
```

#### 3. Configure Nginx as Reverse Proxy

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/mailchamp
```

Add this configuration:

```nginx
upstream mailchamp {
  server 127.0.0.1:3000;
}

server {
  listen 80;
  server_name api.yourdomain.com;

  # Redirect HTTP to HTTPS
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name api.yourdomain.com;

  # SSL certificates (use Let's Encrypt)
  ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

  # Security headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;

  # Logging
  access_log /var/log/nginx/mailchamp_access.log;
  error_log /var/log/nginx/mailchamp_error.log;

  # Reverse proxy
  location / {
    proxy_pass http://mailchamp;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
  }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/mailchamp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 4. Set Up SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d api.yourdomain.com
```

#### 5. Configure Firewall

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow SSH (important!)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable
```

#### 6. Update Mailchimp Webhook URL

1. In Mailchimp, use your production webhook URL:
  - Recommended: `https://acadimiat.rawajtech.com/webhooks/mailchimp`
  - Compatible alias: `https://acadimiat.rawajtech.com`
2. Use the production webhook key from your `.env`

#### 7. Monitor Application

```bash
# View logs
pm2 logs mailchamp

# Monitor processes
pm2 monit

# Check status
pm2 status
```

## Security Best Practices

### 1. Environment Variables

**Never** commit `.env` to git:

```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo "logs/" >> .gitignore
echo "node_modules/" >> .gitignore
```

### 2. Webhook Validation

Always validate Mailchimp webhook signatures:

```env
VALIDATE_MAILCHIMP_SIGNATURE=true
MAILCHIMP_WEBHOOK_KEY=your_secret_key
```

### 3. HTTPS Only

In production:
- Use HTTPS (TLS/SSL)
- Set `HSTS` headers
- Redirect HTTP to HTTPS

### 4. Rate Limiting

Add rate limiting to prevent abuse:

```bash
npm install express-rate-limit
```

Then in `server.js`:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/webhooks/', limiter);
```

### 5. API Key Protection

- Store API keys in environment variables
- Never log sensitive data
- Rotate keys regularly
- Use different keys for dev/prod

### 6. Input Validation

The middleware validates:
- Email format
- Required fields (FNAME, LNAME)
- Email address validity

### 7. Error Handling

- Don't expose internal errors to clients
- Log detailed errors server-side
- Return generic error messages in production

## Monitoring and Maintenance

### Check Application Status

```bash
# Using PM2
pm2 status
pm2 logs mailchamp --lines 50

# Using systemctl
systemctl status mailchamp
journalctl -u mailchamp -n 50
```

### View Logs

```bash
# Development (real-time)
npm run dev  # logs appear in console

# Production
tail -f logs/$(date +%Y-%m-%d).log

# Search for errors
grep -i error logs/*.log

# Search for specific email
grep "email@example.com" logs/*.log
```

### Common Issues

#### 1. Webhook Not Receiving Events

- Check Mailchimp webhook is enabled
- Verify webhook URL is correct
- Check firewall allows incoming traffic
- Test with curl: `curl https://api.yourdomain.com/health`

#### 2. Leads Not Creating in Bitrix24

- Verify Bitrix24 webhook URL is correct
- Check credentials in `.env`
- Look for errors in logs
- Test Bitrix24 webhook independently

#### 3. Signature Validation Fails

- Ensure `MAILCHIMP_WEBHOOK_KEY` matches Mailchimp dashboard
- Check Mailchimp is using correct signing method
- Disable validation temporarily to debug: `VALIDATE_MAILCHIMP_SIGNATURE=false`

#### 4. Port Already in Use

```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

## Scaling Considerations

For high-volume integrations:

1. **Use Message Queue** (RabbitMQ, Redis)
   - Queue webhook events
   - Process asynchronously
   - Prevent message loss

2. **Use Database**
   - Store processed webhooks
   - Implement deduplication
   - Track synchronization status

3. **Implement Retry Logic**
   - Retry failed lead creations
   - Exponential backoff
   - Maximum retry attempts

4. **Add Monitoring**
   - Use Sentry for error tracking
   - Datadog for performance monitoring
   - New Relic for APM

5. **Horizontal Scaling**
   - Use load balancer (nginx, HAProxy)
   - Run multiple Node instances
   - Use clustering module

## API Response Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Lead created or processed |
| 400 | Bad Request | Missing required fields |
| 401 | Unauthorized | Invalid webhook signature |
| 403 | Forbidden | Test endpoint in production |
| 404 | Not Found | Invalid endpoint |
| 500 | Server Error | Internal processing error |
| 503 | Service Unavailable | Bitrix24 unreachable |

## Troubleshooting

### Enable Debug Mode

In development, enable debug logging:

```env
NODE_ENV=development
LOG_LEVEL=DEBUG
```

Then check the logs for detailed information:

```bash
grep DEBUG logs/$(date +%Y-%m-%d).log
```

### Test Individual Components

1. **Test Mailchimp Connection**
   ```bash
   curl -X GET "https://server.api.mailchimp.com/3.0/lists/YOUR_LIST_ID" \
     -u "anystring:YOUR_API_KEY"
   ```

2. **Test Bitrix24 Connection**
   ```bash
   curl -X POST "https://mycompany.bitrix24.com/rest/1/YOUR_ID/crm.lead.add.json" \
     -H "Content-Type: application/json" \
     -d '{"fields": {"NAME": "Test", "LAST_NAME": "User"}}'
   ```

3. **Test Local Endpoint**
   ```bash
   curl http://localhost:3000/health
   ```

## Updating the Application

```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm install

# Restart application
pm2 restart mailchamp

# Verify it's running
pm2 status
```

## Getting Help

- **Mailchimp Docs**: https://mailchimp.com/developer/
- **Bitrix24 Docs**: https://dev.1c-bitrix.ru/
- **Express.js**: https://expressjs.com/
- **Node.js**: https://nodejs.org/

## License

MIT License - feel free to use this in your projects.

## Support

For issues or questions:
1. Check the logs: `logs/$(date +%Y-%m-%d).log`
2. Review the Troubleshooting section
3. Test with the `/webhooks/mailchimp/test` endpoint
4. Check Mailchimp and Bitrix24 webhooks are configured correctly

---

**Version**: 1.0.0  
**Last Updated**: February 23, 2024  
**Status**: Production Ready

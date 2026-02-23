# Quick Start Guide

Get your Mailchimp to Bitrix24 integration running in 5 minutes!

## 🚀 In 5 Minutes

### 1. Install Dependencies

```bash
cd /Users/emadsaeed/Downloads/mailchamp
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
nano .env
```

Add your credentials:
- `MAILCHIMP_API_KEY` - From Mailchimp account settings
- `MAILCHIMP_WEBHOOK_KEY` - From your Mailchimp webhook
- `BITRIX24_WEBHOOK_URL` - From your Bitrix24 CRM setup

### 3. Start Server

```bash
npm run dev
```

You should see:
```
[timestamp] [INFO] Server running at http://localhost:3000
```

### 4. Test It Works

In another terminal:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"ok","timestamp":"2024-02-23T...","uptime":...}
```

### 5. Test Lead Creation

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

Expected response:
```json
{
  "success": true,
  "message": "Test successful",
  "email": "test@example.com",
  "leadId": 12345
}
```

✅ **Done!** Your integration is working!

---

## 📚 Next Steps

### For Local Testing

1. **Install ngrok** - Expose your local server to the internet
   ```bash
   brew install ngrok
   ngrok http 3000
   ```

2. **Update Mailchimp webhook** - Set URL to your ngrok URL
   ```
   https://your-ngrok-id.ngrok.io/webhooks/mailchimp
   ```

3. **Test with real subscribers** - Add a subscriber in Mailchimp and watch the logs!

### For Production

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions on deploying to:
- Heroku (easiest)
- DigitalOcean
- AWS
- Render

---

## 🔧 Configuration Files

### Environment Variables (`.env`)

```env
# Server
NODE_ENV=development
PORT=3000
HOST=localhost

# Mailchimp
MAILCHIMP_API_KEY=your_key_here
MAILCHIMP_LIST_ID=your_list_id
MAILCHIMP_WEBHOOK_KEY=your_webhook_key
VALIDATE_MAILCHIMP_SIGNATURE=true

# Bitrix24
BITRIX24_WEBHOOK_URL=https://company.bitrix24.com/rest/1/ID/crm.lead.add.json
BITRIX24_TIMEOUT=10000
BITRIX24_ASSIGNED_BY_ID=1

# Optional
CHECK_DUPLICATES=false
```

---

## 📁 Project Structure

```
mailchamp/
├── server.js                    # Main Express server
├── routes/mailchimp.js          # Webhook routes
├── services/bitrixService.js    # Bitrix24 API client
├── utils/logger.js              # Logging utility
├── package.json                 # Dependencies
├── .env                         # Configuration (create from .env.example)
├── .env.example                 # Configuration template
├── .gitignore                   # Git ignore rules
├── README.md                    # Full documentation
├── DEPLOYMENT.md                # Deployment guides
├── QUICK_START.md               # This file
├── postman-collection.json      # Postman test collection
├── setup.sh                     # Setup script
└── logs/                        # Log files (created at runtime)
```

---

## 🐛 Troubleshooting

### Port 3000 Already In Use

```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

### Mailchimp Webhook Not Triggering

1. Check webhook URL is correct
2. Verify event types are configured
3. Check logs: `tail -f logs/$(date +%Y-%m-%d).log`

### Leads Not Showing in Bitrix24

1. Verify webhook URL is correct
2. Check Bitrix24 status: 
   ```bash
   curl http://localhost:3000/webhooks/mailchimp/health
   ```
3. Check logs for errors

### Import Postman Collection

1. Open Postman
2. Click **Import**
3. Select `postman-collection.json`
4. All test requests are ready to use

---

## 📖 Documentation

- **[README.md](README.md)** - Complete documentation
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment guides (Heroku, DigitalOcean, AWS, etc.)
- **Postman Collection** - [postman-collection.json](postman-collection.json)

---

## 💡 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Check if server is running |
| GET | `/webhooks/mailchimp/health` | Check Bitrix24 connection |
| POST | `/webhooks/mailchimp` | Production webhook from Mailchimp |
| POST | `/webhooks/mailchimp/test` | Test endpoint (dev only) |

---

## 🔐 Security Tips

1. **Never commit `.env`** - Use `.env.example` as template
2. **Enable webhook validation** - Keep `VALIDATE_MAILCHIMP_SIGNATURE=true`
3. **Use HTTPS in production** - Required for security
4. **Keep secrets in env variables** - Never hardcode API keys
5. **Use ngrok only for testing** - Never expose real server IPs

---

## ❓ Need Help?

1. Check logs: `tail -f logs/$(date +%Y-%m-%d).log`
2. Read [README.md](README.md) for detailed docs
3. Test with `/webhooks/mailchimp/test` endpoint
4. Check Mailchimp and Bitrix24 configurations

---

**Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: February 23, 2024

# Deployment Guide

Complete step-by-step guide for deploying the Mailchimp to Bitrix24 integration to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Deploy to Heroku](#deploy-to-heroku)
4. [Deploy to DigitalOcean](#deploy-to-digitalocean)
5. [Deploy to AWS](#deploy-to-aws)
6. [Deploy to Render](#deploy-to-render)

---

## Prerequisites

### System Requirements

- Node.js v14 or higher
- npm or yarn
- Git
- Mailchimp account
- Bitrix24 account
- Domain name (for production)

### Preparation

1. Ensure your code is in a git repository
2. Have your environment variables ready:
   - Mailchimp API key
   - Mailchimp webhook key
   - Bitrix24 webhook URL
3. Test locally first

---

## Local Development

### 1. Initial Setup

```bash
# Navigate to project
cd /Users/emadsaeed/Downloads/mailchamp

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### 2. Run Locally

```bash
# Development mode with hot reload
npm run dev

# Or production mode
npm start
```

### 3. Test with ngrok

```bash
# In a new terminal
ngrok http 3000

# Use the ngrok URL in Mailchimp webhooks
# https://YOUR-NGROK-ID.ngrok.io/webhooks/mailchimp
```

---

## Deploy to Heroku

Heroku is perfect for beginners - it handles scaling, databases, and SSL automatically.

### 1. Install Heroku CLI

```bash
# macOS
brew tap heroku/brew && brew install heroku

# Verify installation
heroku --version
```

### 2. Login to Heroku

```bash
heroku login
```

### 3. Create Heroku App

```bash
heroku create your-app-name

# Or if you already have a git remote:
# heroku apps:create your-app-name --remote heroku
```

### 4. Set Environment Variables

```bash
# Set individual variables
heroku config:set MAILCHIMP_API_KEY=your_api_key
heroku config:set MAILCHIMP_LIST_ID=your_list_id
heroku config:set MAILCHIMP_WEBHOOK_KEY=your_webhook_key
heroku config:set BITRIX24_WEBHOOK_URL=your_bitrix_url
heroku config:set BITRIX24_ASSIGNED_BY_ID=1
heroku config:set NODE_ENV=production

# Or set from .env file (requires heroku plugin)
heroku plugins:install heroku-config
heroku config:push
```

### 5. Deploy

```bash
# Deploy to Heroku
git push heroku main

# Or if using different branch
git push heroku your-branch:main
```

### 6. View Logs

```bash
heroku logs --tail
```

### 7. Configure Mailchimp Webhook

1. In Mailchimp, go to **Lists > Webhooks**
2. Set URL to: `https://your-app-name.herokuapp.com/webhooks/mailchimp`
3. Select **Subscribe** events
4. Copy signing key to `MAILCHIMP_WEBHOOK_KEY`

### 8. Test

```bash
curl https://your-app-name.herokuapp.com/health

# Should return:
# {"status":"ok","timestamp":"2024-02-23T12:00:00.000Z","uptime":...}
```

### Helpful Heroku Commands

```bash
# View app info
heroku apps:info

# View logs
heroku logs
heroku logs --tail

# Run one-off command
heroku run "node -v"

# Restart dyno
heroku restart

# View environment variables
heroku config

# Delete app
heroku apps:destroy your-app-name
```

---

## Deploy to DigitalOcean

Using a virtual private server for full control.

### 1. Create Droplet

1. Go to DigitalOcean.com
2. Click **Create > Droplets**
3. Choose:
   - Region: Closest to your users
   - Image: Ubuntu 22.04 LTS
   - Size: Basic ($6-12/month)
   - Authentication: SSH key (recommended)
4. Click **Create Droplet**

### 2. Connect to Server

```bash
# SSH into your droplet
ssh root@your-droplet-ip

# Update system
apt update && apt upgrade -y
```

### 3. Install Node.js

```bash
# Install Node.js from NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node -v
npm -v
```

### 4. Clone Project

```bash
# Navigate to webroot
cd /var/www

# Clone your repository
git clone https://github.com/YOUR-USERNAME/mailchamp.git
cd mailchamp

# Install dependencies
npm install --production
```

### 5. Configure Environment

```bash
# Create .env file
cp .env.example .env

# Edit with your credentials
nano .env
```

### 6. Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start application
pm2 start server.js --name "mailchamp"

# Auto-start on reboot
pm2 startup
pm2 save
```

### 7. Install and Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/mailchamp
```

Paste this configuration:

```nginx
upstream mailchamp {
  server 127.0.0.1:3000;
}

server {
  listen 80;
  server_name your-domain.com;

  location / {
    proxy_pass http://mailchamp;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_cache_bypass $http_upgrade;
  }
}
```

Then enable the site:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/mailchamp /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable on startup
sudo systemctl enable nginx
```

### 8. Install SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

Update Nginx config to use HTTPS:

```bash
sudo nano /etc/nginx/sites-available/mailchamp
```

```nginx
upstream mailchamp {
  server 127.0.0.1:3000;
}

server {
  listen 80;
  server_name your-domain.com;
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name your-domain.com;

  ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

  location / {
    proxy_pass http://mailchamp;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_cache_bypass $http_upgrade;
  }
}
```

Restart Nginx:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 9. Configure Firewall

```bash
# Enable firewall
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check rules
sudo ufw status
```

### 10. Test

```bash
curl https://your-domain.com/health
```

### 11. Configure Mailchimp Webhook

Update Mailchimp webhook to:
```
https://your-domain.com/webhooks/mailchimp
```

---

## Deploy to AWS (EC2)

Using Amazon's Elastic Compute Cloud.

### 1. Create EC2 Instance

1. Go to AWS Console
2. Navigate to **EC2 > Instances > Launch Instances**
3. Choose:
   - AMI: Ubuntu Server 22.04 LTS
   - Instance type: t3.micro (eligible for free tier)
   - Key pair: Create or select existing
4. Configure security group:
   - Allow SSH (port 22)
   - Allow HTTP (port 80)
   - Allow HTTPS (port 443)
5. Launch instance

### 2. Connect to Instance

```bash
# SSH into instance
ssh -i /path/to/key.pem ubuntu@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y
```

### 3. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 4. Clone and Setup Project

```bash
cd /home/ubuntu
git clone https://github.com/YOUR-USERNAME/mailchamp.git
cd mailchamp
npm install --production

cp .env.example .env
nano .env  # Edit with your credentials
```

### 5. Install PM2 and Nginx

```bash
# Install PM2
sudo npm install -g pm2
pm2 start server.js --name "mailchamp"
pm2 startup
pm2 save

# Install Nginx
sudo apt install -y nginx
```

### 6. Configure Nginx

Same as DigitalOcean section above (steps 7-8)

### 7. Configure Domain (Route 53)

1. Go to AWS Route 53
2. Create hosted zone for your domain
3. Add A record pointing to your EC2 instance
4. Update nameservers at your domain registrar

### 8. Set Up Auto-Scaling (Optional)

For production, consider using:
- Load Balancer
- Auto Scaling Groups
- RDS Database
- CloudWatch Monitoring

---

## Deploy to Render

Render is a modern alternative to Heroku.

### 1. Connect GitHub Repository

1. Go to Render.com
2. Sign up with GitHub
3. Grant repository access

### 2. Create New Web Service

1. Click **New +** > **Web Service**
2. Select your repository
3. Configure:
   - **Name**: mailchamp
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 3. Set Environment Variables

1. Go to **Environment** tab
2. Add all variables from `.env.example`:
   - MAILCHIMP_API_KEY
   - MAILCHIMP_LIST_ID
   - MAILCHIMP_WEBHOOK_KEY
   - BITRIX24_WEBHOOK_URL
   - NODE_ENV=production

### 4. Deploy

1. Click **Create Web Service**
2. Render automatically deploys from git commits

### 5. Configure Custom Domain

1. Go to **Settings** tab
2. Add your custom domain
3. Update DNS records with Render's nameservers

---

## Monitoring & Maintenance

### Monitor Application

```bash
# PM2 monitoring
pm2 monit

# View real-time logs
pm2 logs mailchamp

# Check application status
pm2 status
```

### Check Logs

```bash
# Last 50 lines
tail -n 50 logs/$(date +%Y-%m-%d).log

# Real-time
tail -f logs/$(date +%Y-%m-%d).log

# Search for errors
grep ERROR logs/$(date +%Y-%m-%d).log
```

### Restart Application

```bash
# PM2
pm2 restart mailchamp

# Nginx
sudo systemctl restart nginx
```

### Update Application

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install --production

# Restart
pm2 restart mailchamp
```

---

## Troubleshooting Deployment

### Application won't start

```bash
# Check logs
pm2 logs mailchamp

# Check if port is in use
lsof -i :3000

# Restart PM2
pm2 restart mailchamp
```

### Webhook not receiving events

1. Verify Mailchimp webhook URL is correct
2. Check firewall allows incoming connections
3. Test with curl: `curl https://your-domain.com/health`
4. Check application logs: `pm2 logs mailchamp`

### SSL certificate issues

```bash
# Check certificate expiry
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test auto-renewal
sudo certbot renew --dry-run
```

### High CPU/Memory usage

1. Check logs for errors
2. Monitor with PM2: `pm2 monit`
3. Consider scaling resources
4. Implement caching if needed

---

## Scaling Considerations

For high-traffic deployments:

1. **Database**
   - Add PostgreSQL/MongoDB
   - Store webhook history
   - Implement deduplication

2. **Message Queue**
   - Redis/RabbitMQ
   - Queue webhook events
   - Process asynchronously

3. **Load Balancer**
   - Distribute traffic
   - Multiple instances
   - Auto-scaling

4. **Monitoring**
   - New Relic
   - Datadog
   - Sentry

5. **Caching**
   - Redis for caching
   - Reduce API calls
   - Improve response times

---

## Security Checklist

- [ ] Change default passwords
- [ ] Enable SSL/TLS
- [ ] Configure firewall
- [ ] Set environment variables securely
- [ ] Validate webhook signatures
- [ ] Implement rate limiting
- [ ] Use HTTPS only
- [ ] Keep dependencies updated
- [ ] Configure backups
- [ ] Enable logging
- [ ] Monitor for errors
- [ ] Test disaster recovery

---

## Cost Comparison

| Platform | Cost | Best For |
|----------|------|----------|
| Heroku | $7-50/month | Beginners |
| Render | $7-25/month | Small apps |
| DigitalOcean | $6-40/month | Full control |
| AWS Free Tier | Free (1 year) | Testing |
| AWS Production | $20-100+/month | Enterprise |

---

## Support

- Heroku Docs: https://devcenter.heroku.com/
- Render Docs: https://render.com/docs
- DigitalOcean Docs: https://docs.digitalocean.com/
- AWS Docs: https://docs.aws.amazon.com/

---

**Last Updated**: February 23, 2024

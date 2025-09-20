# Discord Webhook Setup Guide

This guide explains how to set up Discord notifications for GitHub pull requests in the BetterGov.ph project.

## Prerequisites

- Admin access to the Discord server
- Admin or maintainer access to the GitHub repository
- (Optional) Cloudflare account for Worker deployment

## Method 1: GitHub Actions (Recommended)

This is the simplest method and requires no additional infrastructure.

### Step 1: Create Discord Webhook

1. Open Discord and navigate to your server
2. Go to **Server Settings** (click the server name → Server Settings)
3. Navigate to **Integrations** → **Webhooks**
4. Click **New Webhook**
5. Configure the webhook:
   - **Name**: `BetterGov GitHub Bot`
   - **Channel**: Select `#pull-requests` or your preferred channel
   - **Avatar**: (Optional) Upload a GitHub logo
6. Click **Copy Webhook URL** and save it securely

### Step 2: Add to GitHub Secrets

1. Go to the [BetterGov repository](https://github.com/bettergovph/bettergov)
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the secret:
   - **Name**: `DISCORD_PR_WEBHOOK_URL`
   - **Value**: Paste the Discord webhook URL from Step 1
5. Click **Add secret**

### Step 3: Verify Setup

The GitHub Actions workflow is already configured in `.github/workflows/discord-notifications.yml`. It will automatically:

- Trigger on PR events (open, close, merge, etc.)
- Send formatted messages to Discord
- Include PR details, author info, and status

To test:
1. Create a test pull request
2. Check the Discord channel for the notification
3. The message should appear within seconds

## Method 2: Cloudflare Worker (Advanced)

Use this method for more control and additional features.

### Step 1: Deploy the Worker

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

3. Deploy the webhook function:
   ```bash
   wrangler deploy functions/github-webhook.ts
   ```

4. Note the deployed URL (e.g., `https://github-webhook.your-account.workers.dev`)

### Step 2: Configure Secrets

1. Set the Discord webhook URL:
   ```bash
   wrangler secret put DISCORD_WEBHOOK_URL
   # Enter the Discord webhook URL when prompted
   ```

2. Generate and set GitHub webhook secret:
   ```bash
   # Generate a secret
   openssl rand -hex 32

   # Set it in Cloudflare
   wrangler secret put GITHUB_WEBHOOK_SECRET
   # Enter the generated secret when prompted
   ```

### Step 3: Configure GitHub Webhook

1. Go to the repository **Settings** → **Webhooks**
2. Click **Add webhook**
3. Configure:
   - **Payload URL**: Your Worker URL + `/github-webhook`
   - **Content type**: `application/json`
   - **Secret**: The same secret from Step 2
   - **Events**: Select "Let me select individual events"
     - Check only: **Pull requests**
4. Click **Add webhook**

### Step 4: Test the Webhook

1. GitHub will send a ping event immediately
2. Check the **Recent Deliveries** tab in the webhook settings
3. Create a test PR to verify Discord notifications

## Notification Format

The Discord notifications include:

### Embed Message Structure
- **Title**: PR number and title
- **Description**: PR body (truncated to 300 chars)
- **Author**: GitHub username with avatar
- **Fields**:
  - Repository name with link
  - Branch information (source → target)
  - Current status (Open/Closed/Merged/Draft)
  - File changes statistics (when applicable)
- **Color coding**:
  - 🟢 Green: Opened PRs
  - 🔴 Red: Closed PRs
  - 🟣 Purple: Merged PRs
  - 🔵 Blue: Reopened PRs
  - 🟡 Amber: Ready for review
  - 🟦 Cyan: New commits

## Troubleshooting

### No notifications appearing

1. **Check GitHub Actions logs**:
   - Go to Actions tab in repository
   - Look for "Discord PR Notifications" workflow
   - Check for errors in the logs

2. **Verify webhook URL**:
   - Ensure the URL is correct and includes the full path
   - Test the webhook manually using curl:
     ```bash
     curl -X POST YOUR_WEBHOOK_URL \
       -H "Content-Type: application/json" \
       -d '{"content": "Test message"}'
     ```

3. **Check Discord permissions**:
   - Ensure the webhook has permission to post in the channel
   - Check if the channel is not archived or restricted

### Worker-specific issues

1. **Check Worker logs**:
   ```bash
   wrangler tail functions/github-webhook
   ```

2. **Verify secrets are set**:
   ```bash
   wrangler secret list
   ```

3. **Test signature verification**:
   - Check that the GitHub webhook secret matches
   - Ensure the secret is properly configured in both GitHub and Cloudflare

### Rate Limiting

Discord webhooks have rate limits:
- 30 requests per minute per webhook
- If exceeded, notifications will be delayed

For high-volume repositories, consider:
- Filtering events in the Worker code
- Implementing a queue system
- Using multiple webhooks for different event types

## Security Considerations

1. **Keep webhook URLs private**:
   - Never commit webhook URLs to the repository
   - Use environment variables or secrets
   - Rotate URLs if accidentally exposed

2. **Validate signatures** (Worker method):
   - Always verify GitHub webhook signatures
   - Reject requests with invalid signatures
   - Log suspicious activity

3. **Limit exposed information**:
   - Avoid including sensitive data in notifications
   - Truncate long descriptions
   - Consider private vs public repository needs

## Support

For issues or questions:
1. Check the [GitHub Issues](https://github.com/bettergovph/bettergov/issues)
2. Join the Discord server and ask in #tech-support
3. Review the webhook code in `functions/github-webhook.ts`
import { Context } from './types';

interface GitHubPullRequestEvent {
  action: string;
  number: number;
  pull_request: {
    html_url: string;
    title: string;
    body: string | null;
    user: {
      login: string;
      avatar_url: string;
      html_url: string;
    };
    state: string;
    created_at: string;
    updated_at: string;
    merged: boolean;
    draft: boolean;
    head: {
      ref: string;
      sha: string;
    };
    base: {
      ref: string;
    };
    additions: number;
    deletions: number;
    changed_files: number;
  };
  repository: {
    name: string;
    full_name: string;
    html_url: string;
  };
  sender: {
    login: string;
    avatar_url: string;
  };
}

interface DiscordEmbed {
  title: string;
  description?: string;
  url?: string;
  color: number;
  timestamp?: string;
  author?: {
    name: string;
    icon_url?: string;
    url?: string;
  };
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: {
    text: string;
    icon_url?: string;
  };
}

interface DiscordWebhookPayload {
  content?: string;
  embeds?: DiscordEmbed[];
  username?: string;
  avatar_url?: string;
}

// Color codes for different PR actions
const ACTION_COLORS = {
  opened: 0x22c55e, // Green
  closed: 0xef4444, // Red
  merged: 0x8b5cf6, // Purple
  reopened: 0x3b82f6, // Blue
  ready_for_review: 0xf59e0b, // Amber
  synchronize: 0x06b6d4, // Cyan
  review_requested: 0xec4899, // Pink
} as const;

// Verify GitHub webhook signature
async function verifyGitHubSignature(
  body: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) return false;

  const encoder = new TextEncoder();
  const data = encoder.encode(body);
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const calculatedSignature = `sha256=${signatureArray
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')}`;

  return signature === calculatedSignature;
}

// Format the PR description for Discord
function formatDescription(body: string | null): string {
  if (!body) return 'No description provided.';

  // Truncate long descriptions
  const maxLength = 300;
  let description = body.replace(/\r\n/g, '\n');

  if (description.length > maxLength) {
    description = description.substring(0, maxLength) + '...';
  }

  return description;
}

// Get action description
function getActionDescription(action: string, merged: boolean): string {
  if (action === 'closed' && merged) {
    return 'merged';
  }

  const actionDescriptions: Record<string, string> = {
    opened: 'opened a new pull request',
    closed: 'closed the pull request',
    reopened: 'reopened the pull request',
    ready_for_review: 'marked the pull request ready for review',
    synchronize: 'pushed new commits to',
    review_requested: 'requested a review for',
  };

  return actionDescriptions[action] || `${action} the pull request`;
}

// Create Discord webhook payload
function createDiscordPayload(event: GitHubPullRequestEvent): DiscordWebhookPayload {
  const { action, pull_request: pr, repository, sender } = event;
  const actionDesc = getActionDescription(action, pr.merged);
  const color = pr.merged
    ? ACTION_COLORS.merged
    : ACTION_COLORS[action as keyof typeof ACTION_COLORS] || 0x6b7280;

  const embed: DiscordEmbed = {
    title: `PR #${event.number}: ${pr.title}`,
    description: formatDescription(pr.body),
    url: pr.html_url,
    color,
    timestamp: new Date().toISOString(),
    author: {
      name: `${sender.login} ${actionDesc}`,
      icon_url: sender.avatar_url,
      url: `https://github.com/${sender.login}`,
    },
    fields: [
      {
        name: 'Repository',
        value: `[${repository.full_name}](${repository.html_url})`,
        inline: true,
      },
      {
        name: 'Branch',
        value: `\`${pr.head.ref}\` → \`${pr.base.ref}\``,
        inline: true,
      },
      {
        name: 'Status',
        value: pr.draft ? '📝 Draft' : (pr.merged ? '✅ Merged' : `🔄 ${pr.state}`),
        inline: true,
      },
    ],
    footer: {
      text: 'BetterGov.ph • GitHub',
      icon_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
    },
  };

  // Add file changes for relevant actions
  if (['opened', 'synchronize', 'ready_for_review'].includes(action)) {
    embed.fields?.push({
      name: 'Changes',
      value: `📝 **${pr.changed_files}** files | ➕ **${pr.additions}** additions | ➖ **${pr.deletions}** deletions`,
      inline: false,
    });
  }

  // Add commit SHA for synchronize events
  if (action === 'synchronize') {
    embed.fields?.push({
      name: 'Latest Commit',
      value: `\`${pr.head.sha.substring(0, 7)}\``,
      inline: true,
    });
  }

  return {
    embeds: [embed],
    username: 'BetterGov GitHub Bot',
    avatar_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
  };
}

// Send webhook to Discord
async function sendToDiscord(webhookUrl: string, payload: DiscordWebhookPayload): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Discord webhook failed: ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error('Discord error response:', errorBody);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send Discord webhook:', error);
    return false;
  }
}

export async function onRequestPost(context: Context) {
  const { request, env } = context;

  try {
    // Check for required environment variables
    const discordWebhookUrl = env.DISCORD_WEBHOOK_URL;
    const githubWebhookSecret = env.GITHUB_WEBHOOK_SECRET;

    if (!discordWebhookUrl || !githubWebhookSecret) {
      console.error('Missing required environment variables');
      return new Response('Server configuration error', { status: 500 });
    }

    // Get GitHub event type
    const eventType = request.headers.get('X-GitHub-Event');
    if (eventType !== 'pull_request') {
      return new Response('Event type not supported', { status: 200 });
    }

    // Get and verify signature
    const signature = request.headers.get('X-Hub-Signature-256');
    const body = await request.text();

    const isValid = await verifyGitHubSignature(body, signature, githubWebhookSecret);
    if (!isValid) {
      console.error('Invalid GitHub signature');
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse the webhook payload
    const event = JSON.parse(body) as GitHubPullRequestEvent;

    // Filter out actions we don't want to notify about
    const notifyActions = [
      'opened',
      'closed',
      'reopened',
      'ready_for_review',
      'synchronize',
      'review_requested',
    ];

    if (!notifyActions.includes(event.action)) {
      return new Response('Action not configured for notification', { status: 200 });
    }

    // Create and send Discord notification
    const discordPayload = createDiscordPayload(event);
    const success = await sendToDiscord(discordWebhookUrl, discordPayload);

    if (!success) {
      return new Response('Failed to send Discord notification', { status: 500 });
    }

    return new Response('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// Handle other HTTP methods
export async function onRequestGet() {
  return new Response('GitHub webhook endpoint is active', { status: 200 });
}

export async function onRequest(context: Context) {
  if (context.request.method === 'POST') {
    return onRequestPost(context);
  } else if (context.request.method === 'GET') {
    return onRequestGet();
  }
  return new Response('Method not allowed', { status: 405 });
}
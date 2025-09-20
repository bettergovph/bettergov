import { describe, it, expect, beforeEach, vi } from 'vitest';
import { onRequestPost, onRequestGet } from './github-webhook';

// Mock crypto for testing
const mockCrypto = {
  subtle: {
    importKey: vi.fn(),
    sign: vi.fn(),
  },
};

(globalThis as any).crypto = mockCrypto;

// Mock fetch
global.fetch = vi.fn();

describe('GitHub Webhook Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET requests', () => {
    it('should return status message for GET requests', async () => {
      const response = await onRequestGet();
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toBe('GitHub webhook endpoint is active');
    });
  });

  describe('POST requests', () => {
    const mockEnv = {
      DISCORD_WEBHOOK_URL: 'https://discord.com/api/webhooks/test',
      GITHUB_WEBHOOK_SECRET: 'test-secret',
    };

    const mockPullRequestEvent = {
      action: 'opened',
      number: 123,
      pull_request: {
        html_url: 'https://github.com/bettergovph/bettergov/pull/123',
        title: 'feat: Add new feature',
        body: 'This PR adds a new feature to improve user experience.',
        user: {
          login: 'testuser',
          avatar_url: 'https://github.com/testuser.png',
          html_url: 'https://github.com/testuser',
        },
        state: 'open',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        merged: false,
        draft: false,
        head: {
          ref: 'feature/new-feature',
          sha: 'abc123def456',
        },
        base: {
          ref: 'main',
        },
        additions: 100,
        deletions: 20,
        changed_files: 5,
      },
      repository: {
        name: 'bettergov',
        full_name: 'bettergovph/bettergov',
        html_url: 'https://github.com/bettergovph/bettergov',
      },
      sender: {
        login: 'testuser',
        avatar_url: 'https://github.com/testuser.png',
      },
    };

    it('should reject requests without proper environment variables', async () => {
      const context = {
        request: new Request('https://example.com', {
          method: 'POST',
          headers: {
            'X-GitHub-Event': 'pull_request',
            'X-Hub-Signature-256': 'sha256=test',
          },
          body: JSON.stringify(mockPullRequestEvent),
        }),
        env: {},
      };

      const response = await onRequestPost(context as any);
      expect(response.status).toBe(500);
    });

    it('should ignore non-pull_request events', async () => {
      const context = {
        request: new Request('https://example.com', {
          method: 'POST',
          headers: {
            'X-GitHub-Event': 'push',
            'X-Hub-Signature-256': 'sha256=test',
          },
          body: JSON.stringify({}),
        }),
        env: mockEnv,
      };

      const response = await onRequestPost(context as any);
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toBe('Event type not supported');
    });

    it('should reject requests with invalid signature', async () => {
      mockCrypto.subtle.importKey.mockResolvedValue('mock-key');
      mockCrypto.subtle.sign.mockResolvedValue(new ArrayBuffer(32));

      const context = {
        request: new Request('https://example.com', {
          method: 'POST',
          headers: {
            'X-GitHub-Event': 'pull_request',
            'X-Hub-Signature-256': 'sha256=invalid',
          },
          body: JSON.stringify(mockPullRequestEvent),
        }),
        env: mockEnv,
      };

      const response = await onRequestPost(context as any);
      expect(response.status).toBe(401);
    });

    it('should process valid pull request opened event', async () => {
      // Mock signature validation to pass
      const validSignature = 'sha256=' + '0'.repeat(64);
      mockCrypto.subtle.importKey.mockResolvedValue('mock-key');
      mockCrypto.subtle.sign.mockResolvedValue(new ArrayBuffer(32));

      // Mock Discord webhook response
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
      });

      const context = {
        request: new Request('https://example.com', {
          method: 'POST',
          headers: {
            'X-GitHub-Event': 'pull_request',
            'X-Hub-Signature-256': validSignature,
          },
          body: JSON.stringify(mockPullRequestEvent),
        }),
        env: mockEnv,
      };

      const response = await onRequestPost(context as any);

      // Should call Discord webhook
      expect(global.fetch).toHaveBeenCalledWith(
        mockEnv.DISCORD_WEBHOOK_URL,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should handle Discord webhook failures', async () => {
      // Mock signature validation to pass
      const validSignature = 'sha256=' + '0'.repeat(64);
      mockCrypto.subtle.importKey.mockResolvedValue('mock-key');
      mockCrypto.subtle.sign.mockResolvedValue(new ArrayBuffer(32));

      // Mock Discord webhook failure
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid webhook',
      });

      const context = {
        request: new Request('https://example.com', {
          method: 'POST',
          headers: {
            'X-GitHub-Event': 'pull_request',
            'X-Hub-Signature-256': validSignature,
          },
          body: JSON.stringify(mockPullRequestEvent),
        }),
        env: mockEnv,
      };

      const response = await onRequestPost(context as any);
      expect(response.status).toBe(500);
    });

    it('should handle merged pull requests correctly', async () => {
      const mergedEvent = {
        ...mockPullRequestEvent,
        action: 'closed',
        pull_request: {
          ...mockPullRequestEvent.pull_request,
          merged: true,
        },
      };

      // Mock signature validation to pass
      const validSignature = 'sha256=' + '0'.repeat(64);
      mockCrypto.subtle.importKey.mockResolvedValue('mock-key');
      mockCrypto.subtle.sign.mockResolvedValue(new ArrayBuffer(32));

      // Mock Discord webhook response
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
      });

      const context = {
        request: new Request('https://example.com', {
          method: 'POST',
          headers: {
            'X-GitHub-Event': 'pull_request',
            'X-Hub-Signature-256': validSignature,
          },
          body: JSON.stringify(mergedEvent),
        }),
        env: mockEnv,
      };

      const response = await onRequestPost(context as any);

      // Check that Discord webhook was called
      expect(global.fetch).toHaveBeenCalled();
      const callArgs = (global.fetch as any).mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);

      // Should show merged status
      expect(payload.embeds[0].color).toBe(0x8b5cf6); // Purple for merged
      expect(payload.embeds[0].author.name).toContain('merged');
    });

    it('should skip notification for unsupported actions', async () => {
      const unsupportedEvent = {
        ...mockPullRequestEvent,
        action: 'labeled', // Not in our notify list
      };

      // Mock signature validation to pass
      const validSignature = 'sha256=' + '0'.repeat(64);
      mockCrypto.subtle.importKey.mockResolvedValue('mock-key');
      mockCrypto.subtle.sign.mockResolvedValue(new ArrayBuffer(32));

      const context = {
        request: new Request('https://example.com', {
          method: 'POST',
          headers: {
            'X-GitHub-Event': 'pull_request',
            'X-Hub-Signature-256': validSignature,
          },
          body: JSON.stringify(unsupportedEvent),
        }),
        env: mockEnv,
      };

      const response = await onRequestPost(context as any);
      expect(response.status).toBe(200);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
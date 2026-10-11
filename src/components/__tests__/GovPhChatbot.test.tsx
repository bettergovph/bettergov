import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import GovPhChatbot from '../ui/GovPhChatbot';
import {
  ASSISTANT_STORAGE_KEY,
  askAssistant,
  type AskAssistantOptions,
  type AssistantAnswer,
} from '../../lib/assistant';

vi.mock('../../lib/assistant', async importOriginal => {
  const actual = await importOriginal<typeof import('../../lib/assistant')>();
  return { ...actual, askAssistant: vi.fn() };
});

const askMock = vi.mocked(askAssistant);

const answer = (overrides: Partial<AssistantAnswer> = {}): AssistantAnswer => ({
  answerHtml:
    '<p>Renew at any <a href="https://passport.gov.ph">DFA office</a>.</p>',
  sessionId: 'sess-1',
  pendingConfirmation: null,
  responseKind: 'answer',
  finishReason: 'stop',
  ...overrides,
});

const openWidget = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Open GovPH Chatbot' }));
  return screen.getByLabelText('Ask a question') as HTMLTextAreaElement;
};

const send = (input: HTMLTextAreaElement, text: string) => {
  fireEvent.change(input, { target: { value: text } });
  fireEvent.keyDown(input, { key: 'Enter' });
};

describe('GovPhChatbot', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    askMock.mockReset();
  });

  afterEach(() => vi.useRealTimers());

  it('opens to a greeting with suggested questions', () => {
    render(<GovPhChatbot />);
    expect(screen.queryByRole('dialog')).toBeNull();

    openWidget();

    expect(
      screen.getByRole('dialog', { name: 'GovPH Chatbot' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Ask me about Philippine government services/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'How do I renew my passport?' })
    ).toBeInTheDocument();
  });

  it('streams progress, then renders the sanitised answer and keeps the session', async () => {
    let resolveAnswer: (value: AssistantAnswer) => void = () => {};
    let callbacks: AskAssistantOptions | null = null;
    askMock.mockImplementationOnce((options: AskAssistantOptions) => {
      callbacks = options;
      options.onProgress?.('Checking verified answers');
      return new Promise(resolve => {
        resolveAnswer = resolve;
      });
    });

    render(<GovPhChatbot />);
    const input = openWidget();
    send(input, 'How do I renew my passport?');

    // The user's bubble and the progress label show while the request is in
    // flight; the suggestions go away and the composer offers Stop.
    expect(screen.getByText('How do I renew my passport?')).toBeInTheDocument();
    expect(screen.getByText('Checking verified answers')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: 'How do I get a PhilSys national ID?',
      })
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Stop generating' })
    ).toBeInTheDocument();
    expect(input.value).toBe('');

    // Partial text replaces the progress label as chunks arrive.
    act(() => callbacks?.onChunk?.('Renew at '));
    expect(screen.getByText('Renew at')).toBeInTheDocument();
    expect(screen.queryByText('Checking verified answers')).toBeNull();
    expect(screen.getByText('Writing the answer')).toBeInTheDocument();

    await act(async () => {
      resolveAnswer(answer());
    });

    // The complete answer replaces the chunk text.
    const link = await screen.findByRole('link', { name: 'DFA office' });
    expect(link).toHaveAttribute('href', 'https://passport.gov.ph');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.queryByText('Writing the answer')).toBeNull();
    expect(screen.queryByText('Renew at')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Send question' })
    ).toBeInTheDocument();

    expect(askMock).toHaveBeenCalledTimes(1);
    expect(askMock.mock.calls[0][0]).toMatchObject({
      question: 'How do I renew my passport?',
      sessionId: null,
    });

    // The follow-up carries the session id the first answer returned.
    askMock.mockResolvedValueOnce(
      answer({ answerHtml: '<p>₱950.</p>', sessionId: 'sess-1' })
    );
    send(input, 'How much is it?');
    await screen.findByText('₱950.');
    expect(askMock.mock.calls[1][0]).toMatchObject({
      question: 'How much is it?',
      sessionId: 'sess-1',
    });

    const stored = JSON.parse(
      window.sessionStorage.getItem(ASSISTANT_STORAGE_KEY) ?? '{}'
    );
    expect(stored.sessionId).toBe('sess-1');
    expect(stored.messages).toHaveLength(4);
  });

  it('asks for approval on pending_confirmation and resends with the token', async () => {
    askMock.mockResolvedValueOnce(
      answer({
        answerHtml: '<p>I can file that report for you.</p>',
        pendingConfirmation: {
          token: 'c'.repeat(32),
          message: 'Submit the report now?',
        },
      })
    );

    render(<GovPhChatbot />);
    const input = openWidget();
    send(input, 'Report a broken streetlight');

    await screen.findByText('Approval needed');
    expect(screen.getByText('Submit the report now?')).toBeInTheDocument();

    askMock.mockResolvedValueOnce(
      answer({ answerHtml: '<p>Filed.</p>', sessionId: 'sess-1' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

    await screen.findByText('Filed.');
    expect(screen.getByText('Yes, go ahead.')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve' })).toBeNull();
    expect(askMock.mock.calls[1][0]).toMatchObject({
      question: 'Report a broken streetlight',
      sessionId: 'sess-1',
      confirmation: { token: 'c'.repeat(32), approved: true },
    });
  });

  it('lets the user decline a pending confirmation without sending anything', async () => {
    askMock.mockResolvedValueOnce(
      answer({
        pendingConfirmation: { token: 'c'.repeat(32), message: 'Proceed?' },
      })
    );
    render(<GovPhChatbot />);
    send(openWidget(), 'Do the thing');
    await screen.findByText('Approval needed');

    fireEvent.click(screen.getByRole('button', { name: 'Not now' }));
    expect(screen.getByText(/Not approved/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve' })).toBeNull();
    expect(askMock).toHaveBeenCalledTimes(1);
  });

  it('shows the error message and retries the same question', async () => {
    const { AssistantError } = await vi.importActual<
      typeof import('../../lib/assistant')
    >('../../lib/assistant');
    askMock.mockRejectedValueOnce(
      new AssistantError('Slow down.', 'http', 429)
    );

    render(<GovPhChatbot />);
    send(openWidget(), 'Where is the nearest SSS branch?');

    await screen.findByText('Slow down.');

    askMock.mockResolvedValueOnce(answer({ answerHtml: '<p>Makati.</p>' }));
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    await screen.findByText('Makati.');
    expect(screen.queryByText('Slow down.')).toBeNull();
    expect(
      screen.getAllByText('Where is the nearest SSS branch?')
    ).toHaveLength(1);
    expect(askMock).toHaveBeenCalledTimes(2);
    expect(askMock.mock.calls[1][0]).toMatchObject({
      question: 'Where is the nearest SSS branch?',
    });
  });

  it('aborts the in-flight request when Stop is pressed', async () => {
    askMock.mockImplementationOnce(
      (options: AskAssistantOptions) =>
        new Promise((_, reject) => {
          options.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError'))
          );
        })
    );
    render(<GovPhChatbot />);
    send(openWidget(), 'Long question');
    expect(askMock.mock.calls[0][0].signal?.aborted).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Stop generating' }));
    expect(askMock.mock.calls[0][0].signal?.aborted).toBe(true);
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Send question' })
      ).toBeInTheDocument()
    );
  });

  it('restores a stored conversation and clears it on reset', async () => {
    window.sessionStorage.setItem(
      ASSISTANT_STORAGE_KEY,
      JSON.stringify({
        sessionId: 'sess-old',
        messages: [
          { id: 'u1', role: 'user', text: 'Earlier question' },
          { id: 'a1', role: 'assistant', html: '<p>Earlier answer</p>' },
        ],
      })
    );

    render(<GovPhChatbot />);
    openWidget();
    expect(screen.getByText('Earlier question')).toBeInTheDocument();
    expect(screen.getByText('Earlier answer')).toBeInTheDocument();

    askMock.mockResolvedValueOnce(answer());
    send(
      screen.getByLabelText('Ask a question') as HTMLTextAreaElement,
      'Next'
    );
    await screen.findByRole('link', { name: 'DFA office' });
    expect(askMock.mock.calls[0][0]).toMatchObject({ sessionId: 'sess-old' });

    fireEvent.click(
      screen.getByRole('button', { name: 'Start a new conversation' })
    );
    expect(screen.queryByText('Earlier question')).toBeNull();
    expect(window.sessionStorage.getItem(ASSISTANT_STORAGE_KEY)).toBeNull();
    expect(
      screen.getByRole('button', { name: 'How do I renew my passport?' })
    ).toBeInTheDocument();
  });

  it('closes on Escape and from the header button', () => {
    render(<GovPhChatbot />);
    const input = openWidget();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();

    openWidget();
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Close' })
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import NewsletterSignup from '../v2/layout/NewsletterSignup';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const fetchMock = vi.fn();

const submitAddress = () => {
  vi.stubGlobal('fetch', fetchMock);
  render(<NewsletterSignup />);
  fireEvent.change(screen.getByLabelText('newsletter.emailLabel'), {
    target: { value: 'reader@example.com' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'newsletter.submit' }));
};

const status = () => screen.getByRole('status');

describe('<NewsletterSignup />', () => {
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('posts the address and shows a success message', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 202 }));
    submitAddress();
    await waitFor(() =>
      expect(status()).toHaveTextContent('newsletter.success')
    );
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/newsletter');
    expect(JSON.parse(init.body)).toEqual({
      email: 'reader@example.com',
      website: '',
    });
    expect(screen.getByLabelText('newsletter.emailLabel')).toHaveValue('');
  });

  it('says the newsletter is not open yet when the server answers 503', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 503 }));
    submitAddress();
    await waitFor(() =>
      expect(status()).toHaveTextContent('newsletter.unavailable')
    );
    // The address stays so the visitor does not retype it later.
    expect(screen.getByLabelText('newsletter.emailLabel')).toHaveValue(
      'reader@example.com'
    );
  });

  it('shows a retry message when the request fails', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    submitAddress();
    await waitFor(() =>
      expect(status()).toHaveTextContent('newsletter.failed')
    );
  });

  it('keeps the honeypot field out of the tab order and screen readers', () => {
    render(<NewsletterSignup />);
    const trap = document.querySelector('input[name="website"]');
    expect(trap).toHaveAttribute('tabindex', '-1');
    expect(trap?.closest('[aria-hidden="true"]')).not.toBeNull();
  });
});

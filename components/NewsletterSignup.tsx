'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function NewsletterSignup({
  compact = false,
  center = false,
}: {
  compact?: boolean;
  center?: boolean;
}) {
  const t = useTranslations('newsletter');
  const tc = useTranslations('common');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!email || !emailRegex.test(email) || email.length > 255) {
        setStatus('Please enter a valid email address.');
        return;
      }

      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(body.error ?? 'An error occurred. Please try again.');
        return;
      }
      // Confirmed opt-in: they are NOT subscribed yet, and saying they are
      // would be the one lie this form can tell. The list only gains them when
      // they click the link.
      setStatus(
        'Almost there — check your inbox and click the link to confirm. ' +
          'Nobody can add you to this list but you.',
      );
      setEmail('');
    } catch (error) {
      console.error('Subscription error:', error);
      setStatus('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Escape HTML in status message to prevent XSS
  const sanitizeHtml = (str: string) => {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (match) => {
      const escape: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return escape[match];
    });
  };

  if (compact) {
    return (
      <div className={center ? 'flex flex-col items-center' : undefined}>
        <h2 className="text-xl font-semibold mb-3">{t('tagline')}</h2>
        <form
          onSubmit={handleSubmit}
          className={`flex flex-col sm:flex-row gap-3 ${
            center ? 'items-center justify-center' : 'items-start'
          }`}
        >
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('emailPlaceholder')}
            required
            maxLength={255}
            disabled={isSubmitting}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md p-2 w-full sm:w-72"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="button whitespace-nowrap"
          >
            {isSubmitting ? t('submitting') : tc('subscribe')}
          </button>
        </form>
        {status && (
          <p
            className={`mt-2 text-sm ${status.includes('error') || status.includes('failed') ? 'text-red-600' : 'text-green-600'}`}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(status) }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="hero-wrapper w-inline-block py-2 border-y border-gray-100">
      <div className="hero-content">
        <h2>{t('heading')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              required
              maxLength={255}
              disabled={isSubmitting}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="button w-full"
          >
            {isSubmitting ? t('submitting') : tc('subscribe')}
          </button>
          {status && (
            <p
              className={`mt-2 text-sm ${status.includes('error') || status.includes('failed') ? 'text-red-600' : 'text-green-600'}`}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(status) }}
            />
          )}
        </form>
      </div>
    </div>
  );
}

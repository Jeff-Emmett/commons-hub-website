//added by windsurf start
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Email validation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!email || !emailRegex.test(email) || email.length > 255) {
        setStatus('Please enter a valid email address.');
        return;
      }
      
      // Create Supabase client
      const supabase = createClient();
      
      // Insert subscriber directly
      const { error } = await supabase
        .from('subscribers')
        .insert([{ email }]);
      
      if (error) {
        // Check if it's a unique violation (duplicate email)
        if (error.code === '23505') { // Postgres unique constraint violation
          setStatus('Thank you for your interest!');
          setEmail('');
        } else {
          console.error('Subscription error:', error);
          setStatus('An error occurred. Please try again.');
        }
      } else {
        setStatus('Thank you for subscribing!');
        setEmail('');
      }
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

  return (
    <div className="hero-wrapper w-inline-block py-2 border-y border-gray-100">
      <div className="hero-content">
        <h2>Newsletter</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
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
            {isSubmitting ? 'Subscribing...' : 'Subscribe'}
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
//added by windsurf end

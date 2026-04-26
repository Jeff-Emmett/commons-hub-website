'use client';

import React from 'react';

interface FormWrapperProps {
  children: React.ReactNode;
  noForm?: boolean;
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
  className?: string;
}

/**
 * FormWrapper component that conditionally renders either a form element or a div
 * Used to prevent nested form issues when forms are embedded within other forms
 */
export default function FormWrapper({
  children,
  noForm = false,
  onSubmit,
  className = '',
}: FormWrapperProps) {
  // If noForm is true, render a div instead of a form
  if (noForm) {
    return <div className={className}>{children}</div>;
  }

  // Otherwise render a regular form
  return (
    <form onSubmit={onSubmit} className={className}>
      {children}
    </form>
  );
}

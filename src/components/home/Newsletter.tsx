import React, { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Optimistic success; replace with real API later
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="card newsletter" role="status" aria-live="polite">
        <h2 style={{ marginTop: 0 }}>Thanks for subscribing!</h2>
        <p className="muted">We'll send occasional updates on kits and STL releases.</p>
      </div>
    );
  }

  return (
    <form className="card newsletter" onSubmit={onSubmit} aria-label="Newsletter signup">
      <h2 style={{ marginTop: 0 }}>Stay in the loop</h2>
      <p className="muted">Get product drops and build tips. No spam.</p>
      <div className="news-form">
        <label htmlFor="nl-email" className="visually-hidden">Email address</label>
        <input
          id="nl-email"
          type="email"
          name="email"
          required
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="btn primary">Subscribe</button>
      </div>
    </form>
  );
}

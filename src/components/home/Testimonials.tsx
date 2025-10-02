import "./Testimonials.css";

export default function Testimonials() {
  const quotes = [
    { q: "Best RC build I’ve ever done.", n: "Alex P." },
    { q: "STLs printed cleanly and fit perfectly.", n: "Jordan R." },
    { q: "The kit was driving the same day.", n: "Sam K." },
  ];
  return (
    <div>
      <h2 className="testimonials-heading">What builders say</h2>
      <div className="test-grid">
        {quotes.slice(0, 2).map((t, idx) => (
          <figure key={idx} className="card testimonials-card">
            <blockquote className="testimonials-quote">&ldquo;{t.q}&rdquo;</blockquote>
            <figcaption className="muted testimonials-author">— {t.n}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

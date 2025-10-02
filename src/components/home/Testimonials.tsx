

export default function Testimonials() {
  const quotes = [
    { q: "Best RC build I’ve ever done.", n: "Alex P." },
    { q: "STLs printed cleanly and fit perfectly.", n: "Jordan R." },
    { q: "The kit was driving the same day.", n: "Sam K." },
  ];
  return (
    <div>
      <h2 style={{ margin: 0, marginBottom: 8, fontSize: "clamp(20px,3vw,28px)" }}>What builders say</h2>
      <div className="test-grid">
        {quotes.slice(0, 2).map((t, idx) => (
          <figure key={idx} className="card" style={{ margin: 0, padding: 16 }}>
            <blockquote style={{ margin: 0, fontSize: 16, lineHeight: 1.4 }}>&ldquo;{t.q}&rdquo;</blockquote>
            <figcaption className="muted" style={{ marginTop: 8 }}>— {t.n}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

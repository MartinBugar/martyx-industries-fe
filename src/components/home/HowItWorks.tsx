import './HowItWorks.css';

export default function HowItWorks() {
  const steps = [
    { n: 1, title: "Choose", text: "Kit or STL bundle" },
    { n: 2, title: "Build or Print", text: "Assemble or 3D print" },
    { n: 3, title: "Drive", text: "Pair controller & enjoy" },
  ];
  return (
    <div className="card how-it-works">
      <h2>How it works</h2>
      <div className="hiw">
        {steps.map(s => (
          <div key={s.n} className="card item how-it-works-item">
            <div className="step">Step {s.n}</div>
            <div className="how-it-works-title">{s.title}</div>
            <div className="muted">{s.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

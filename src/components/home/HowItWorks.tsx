

export default function HowItWorks() {
  const steps = [
    { n: 1, title: "Choose", text: "Kit or STL bundle" },
    { n: 2, title: "Build or Print", text: "Assemble or 3D print" },
    { n: 3, title: "Drive", text: "Pair controller & enjoy" },
  ];
  return (
    <div className="card">
      <h2 style={{marginBottom:12}}>How it works</h2>
      <div className="hiw">
        {steps.map(s => (
          <div key={s.n} className="card item" style={{background:"var(--surface)"}}>
            <div className="step">Step {s.n}</div>
            <div style={{fontWeight:700, margin:"6px 0"}}>{s.title}</div>
            <div className="muted">{s.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

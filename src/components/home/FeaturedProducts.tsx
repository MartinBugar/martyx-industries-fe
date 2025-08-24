import React from "react";
import { Link } from "react-router-dom";

type Item = {
  id: string;
  name: string;
  price: string;
  image: string;
  tag?: string;
};

const items: Item[] = [
  { id: "k1", name: "RC Tank Kit MK I", price: "$299", image: "/assets/kit-01.png", tag: "Configurator" },
  { id: "k2", name: "RC Tank Kit MK II", price: "$349", image: "/assets/kit-02.png" },
  { id: "s1", name: "STL Bundle — Tracks", price: "$29", image: "/assets/stl-01.png" },
];

export default function FeaturedProducts() {
  return (
    <div>
      <div style={{display:"flex", justifyContent:"space-between", marginBottom:12}}>
        <h2 style={{ margin: 0, fontSize: "clamp(20px,3vw,28px)" }}>Featured</h2>
        <Link className="btn" to="/shop">View all</Link>
      </div>
      <div className="cards" aria-label="Featured products">
        {items.map((p) => (
          <Link key={p.id} to={`/product/${p.id}`} className="card" aria-label={`${p.name} ${p.price}`}>
            <img className="img" src={p.image} alt={p.name} loading="lazy" decoding="async" />
            <div style={{display:"flex", justifyContent:"space-between", marginTop:8}}>
              <div>
                <div style={{ fontWeight: 700 }}>{p.name}</div>
                <div className="muted">{p.price}</div>
              </div>
              {p.tag && <span className="muted">{p.tag}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

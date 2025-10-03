import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'MartyX Industries - Premium 3D-Printed RC Models';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0066CC 0%, #004499 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
          color: 'white',
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 'bold',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          MartyX Industries
        </div>
        <div
          style={{
            fontSize: 36,
            textAlign: 'center',
            opacity: 0.9,
          }}
        >
          Premium 3D-Printed RC Models & Components
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

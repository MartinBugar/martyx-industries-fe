import React from 'react';
import './Pages.css';

const About: React.FC = () => {
  return (
    <div className="page-container about-page">
      <h1>About Martyx Industries</h1>
      
      <section className="about-section">
        <h2>Our Story</h2>
        <p>
          Founded in 2020, Martyx Industries has been at the forefront of 3D product innovation.
          We specialize in creating high-quality 3D models and products for various industries.
        </p>
      </section>
      
      <section className="about-section">
        <h2>Our Mission</h2>
        <p>
          At Martyx Industries, our mission is to provide cutting-edge 3D solutions that help
          businesses and individuals bring their ideas to life. We believe in the power of
          visualization and strive to make 3D technology accessible to everyone.
        </p>
      </section>
      
      <section className="about-section">
        <h2>Contact Us</h2>
        <p>
          Have questions or want to learn more about our products? Reach out to us:
        </p>
        <div className="contact-info">
          <p>Email: info@martyxindustries.com</p>
          <p>Phone: (555) 123-4567</p>
          <p>Address: 123 Innovation Way, Tech City, TC 12345</p>
        </div>
      </section>
    </div>
  );
};

export default About;
import ClinicHours from '../components/ClinicHours';
import Announcements from '../components/Announcements';
import ClinicLocation from '../components/ClinicLocation';
import ClinicStatus from '../components/ClinicStatus';

function Home({ token, openPage }) {
  return (
    <main>
      <section className="hero" id="home">
        <div className="hero-content">
          <span className="eyebrow">
            CAMPUS HEALTHCARE, MADE SIMPLE
          </span>

          <h1>
            Your health.
            <br />
            <span>Your time matters.</span>
          </h1>

          <p>
            Book clinic appointments, join the queue, and check your queue
            status without waiting blindly at the clinic.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => openPage(token ? 'dashboard' : 'register')}
            >
              {token ? 'Go to Dashboard' : 'Get Started'}
            </button>

            <a className="secondary-button" href="#services">
              Explore Services
            </a>
          </div>
        </div>

        <div className="queue-card">
          <div className="queue-card-header">
            <span className="status-dot"></span>
            CLINIC QUEUE
            <span className="live-label">QUEUE PREVIEW</span>
          </div>

          <div className="queue-number">Q-0001</div>
          <p className="queue-description">Example queue number</p>

          <div className="queue-divider"></div>

          <div className="queue-details">
            <span>Department</span>
            <strong>General Medicine</strong>
          </div>

          <div className="queue-details">
            <span>Status</span>
            <strong className="waiting-status">Waiting</strong>
          </div>

          <p className="demo-note">Sample data for demonstration</p>
        </div>
      </section>

      <ClinicHours />
      <ClinicLocation />
        <ClinicStatus />
      <Announcements />

      <section className="services" id="services">
        <div className="section-heading">
          <span className="eyebrow">WHAT YOU CAN DO</span>
          <h2>Clinic services, made easier.</h2>
          <p>Access the essentials in one convenient place.</p>
        </div>

        <div className="service-grid">
          <article className="service-card">
            <span className="service-icon">01</span>
            <h3>Book an Appointment</h3>
            <p>
              Choose an available date and time for your clinic visit.
            </p>
          </article>

          <article className="service-card">
            <span className="service-icon">02</span>
            <h3>Join the Queue</h3>
            <p>
              Register for a walk-in visit and receive your queue entry.
            </p>
          </article>

          <article className="service-card">
            <span className="service-icon">03</span>
            <h3>Track Your Status</h3>
            <p>
              Check your queue status and appointment information.
            </p>
          </article>
        </div>
      </section>

      <section className="appointment-banner" id="appointments">
        <div>
          <span className="eyebrow">READY TO GET STARTED?</span>
          <h2>Your clinic visit starts here.</h2>
          <p>
            Create an account or log in to manage your clinic queue.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => openPage(token ? 'dashboard' : 'register')}
        >
          {token ? 'Go to Dashboard' : 'Create Account'}
        </button>
      </section>
    </main>
  );
}

export default Home;
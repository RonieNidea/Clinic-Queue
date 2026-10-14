
function ClinicLocation() {
  const mapUrl =
    'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent(
      "St. Peter's College, 042 Sabayle Street, Iligan City, Philippines"
    );

  return (
    <section className="clinic-location" id="clinic-location">
      <div className="section-heading">
        <span className="eyebrow">FIND YOUR WAY</span>
        <h2>Clinic Location &amp; Directions</h2>
        <p>
          Find St. Peter's College and get directions to the
          campus clinic.
        </p>
      </div>

      <div className="location-grid">
        {/* Campus address */}
        <article className="location-card">
          <div className="location-icon">📍</div>

          <h3>Campus Address</h3>

          <p>
            St. Peter's College
            <br />
            No. 042 Sabayle Street
            <br />
            Iligan City, Philippines
          </p>

          <a
            className="location-button"
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Google Maps ↗
          </a>
        </article>

        {/* Clinic room directions */}
        <article className="location-card">
          <div className="location-icon">🧭</div>

          <h3>How to Find the Clinic</h3>

          <ol className="location-directions">
            <li>Go to the St. Peter's College campus.</li>
            <li>
              Ask the guard or school personnel for directions
              to the medical and dental clinic.
            </li>
            <li>
              Follow the directions to the clinic reception
              area.
            </li>
          </ol>

          <p className="location-note">
            Exact building, floor, and room number need to be
            confirmed with the school.
          </p>
        </article>
      </div>

      {/* Official clinic information */}
      <div className="official-clinic-link">
        <h3>Need More Information?</h3>

        <p>
          Visit the official St. Peter's College clinic page
          for clinic services and contact information.
        </p>

        <a
          href="https://www.spc.edu.ph/office-of-the-student-affairs-and-services/clinic/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Visit Official Clinic Page ↗
        </a>
      </div>
    </section>
  );
}

export default ClinicLocation;

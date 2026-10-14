function ClinicHours() {
  const services = [
    {
      name: 'General Consultation',
      fee: 'Confirm with clinic',
    },
    {
      name: 'Basic First Aid',
      fee: 'Confirm with clinic',
    },
    {
      name: 'Nursing Assistance',
      fee: 'Confirm with clinic',
    },
    {
      name: 'Health Assessment',
      fee: 'Confirm with clinic',
    },
  ];

  return (
    <section className="clinic-info" id="clinic-hours">
      <div className="section-heading">
        <span className="eyebrow">PLAN YOUR VISIT</span>
        <h2>Clinic Hours, Services &amp; Fees</h2>
        <p>
          Check the clinic schedule, available healthcare services,
          and fee information before visiting.
        </p>
      </div>

      <div className="clinic-info-grid">
        {/* Operating hours */}
        <article className="clinic-info-card">
          <div className="clinic-info-icon">◷</div>
          <h3>Operating Hours</h3>
          <p className="clinic-info-description">
            Regular clinic schedule
          </p>

          <div className="clinic-hours-row">
            <span>Monday – Friday</span>
            <strong>8:00 AM – 5:00 PM</strong>
          </div>

          <div className="clinic-hours-row">
            <span>Saturday</span>
            <strong>8:00 AM – 12:00 PM</strong>
          </div>

          <div className="clinic-hours-row">
            <span>Sunday &amp; Holidays</span>
            <strong className="closed-label">Closed</strong>
          </div>

          <p className="clinic-info-note">
            Sample schedule. Confirm the official clinic hours.
          </p>
        </article>

        {/* Services and fees */}
        <article className="clinic-info-card">
          <div className="clinic-info-icon">✚</div>
          <h3>Services &amp; Fees</h3>
          <p className="clinic-info-description">
            Available healthcare services and fee information
          </p>

          <ul className="clinic-service-list">
            {services.map((service) => (
              <li key={service.name}>
                <div>
                  <span>{service.name}</span>
                  <small className="service-fee">
                    {service.fee}
                  </small>
                </div>

                <span className="service-available">
                  Check availability
                </span>
              </li>
            ))}
          </ul>

          <p className="clinic-info-note">
            Fees and service availability must be confirmed with
            clinic staff before your visit.
          </p>
        </article>

        {/* Payment information */}
        <article className="clinic-info-card">
        <div className="clinic-info-icon">₱</div>

        <h3>Payment Information</h3>

        <p className="clinic-info-description">
            Important reminders before receiving clinic services
        </p>

        <ul className="clinic-payment-list">
            <li>Ask clinic staff whether your requested service has a fee.</li>
            <li>Confirm accepted payment methods before paying.</li>
            <li>Request an official receipt when payment is required.</li>
            <li>Avoid sending payments to unverified personal accounts.</li>
        </ul>

        <p className="clinic-info-note">
            No payments are collected through this demonstration website.
            Please follow the official instructions provided by your campus clinic.
        </p>
        </article>

      </div>
    </section>
  );
}

export default ClinicHours;

const announcements = [
  {
    tag: 'Clinic Reminder',
    title: 'Check Clinic Hours Before Visiting',
    description:
      'Check the clinic operating hours before planning your visit. Contact the clinic to confirm availability.',
  },
  {
    tag: 'Appointments',
    title: 'Plan Your Clinic Visit',
    description:
      'Review your appointment details before arriving. Check the available appointment options if your plans change.',
  },
  {
    tag: 'Queue Updates',
    title: 'Keep Your Queue Information Ready',
    description:
      'If you join the walk-in queue, check your queue status through your ClinicQueue dashboard.',
  },
];

function Announcements() {
  return (
    <section className="announcements" id="announcements">
      <div className="section-heading">
        <span className="eyebrow">STAY INFORMED</span>
        <h2>Clinic Announcements</h2>
        <p>
          Stay updated with important clinic schedules and reminders.
        </p>
      </div>

      <div className="announcement-list">
        {announcements.map((announcement, index) => (
          <article className="announcement-card" key={announcement.tag}>
            <div className="announcement-date">
              <span>INFO</span>
              <strong>{String(index + 1).padStart(2, '0')}</strong>
            </div>

            <div className="announcement-content">
              <span className="announcement-tag">{announcement.tag}</span>
              <h3>{announcement.title}</h3>
              <p>{announcement.description}</p>
            </div>
          </article>
        ))}
      </div>

      <p className="announcement-note">
        These are sample announcements for demonstration. Replace them
        with official campus clinic announcements before launch.
      </p>
    </section>
  );
}

export default Announcements;
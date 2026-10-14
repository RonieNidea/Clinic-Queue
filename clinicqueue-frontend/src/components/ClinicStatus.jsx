
import { useEffect, useState } from 'react';

function getClinicStatus() {
  // Use Philippine local time for the clinic schedule.
  const now = new Date();

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Manila',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  const weekday = values.weekday;
  const minutes = Number(values.hour) * 60 + Number(values.minute);

  const isSaturday = weekday === 'Sat';
  const isSunday = weekday === 'Sun';

  const openingTime = 8 * 60;
  const closingTime = isSaturday ? 12 * 60 : 17 * 60;

  const isOpen =
    !isSunday &&
    minutes >= openingTime &&
    minutes < closingTime;

  if (isOpen) {
    return {
      isOpen: true,
      title: 'Clinic is Open',
      description: isSaturday
        ? 'The clinic is open until 12:00 PM today.'
        : 'The clinic is open until 5:00 PM today.',
    };
  }

  if (isSunday) {
    return {
      isOpen: false,
      title: 'Clinic is Closed',
      description: 'The clinic is closed on Sundays. Check again on Monday at 8:00 AM.',
    };
  }

  if (minutes < openingTime) {
    return {
      isOpen: false,
      title: 'Clinic is Closed',
      description: 'The clinic opens today at 8:00 AM.',
    };
  }

  if (isSaturday) {
    return {
      isOpen: false,
      title: 'Clinic is Closed',
      description: 'The clinic opens again on Monday at 8:00 AM.',
    };
  }

  return {
    isOpen: false,
    title: 'Clinic is Closed',
    description: 'The clinic opens tomorrow at 8:00 AM.',
  };
}

function ClinicStatus() {
  const [status, setStatus] = useState(getClinicStatus);

  useEffect(() => {
    // Refresh the status every minute.
    const timer = setInterval(() => {
      setStatus(getClinicStatus());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section
      className={`clinic-status ${status.isOpen ? 'is-open' : 'is-closed'}`}
      aria-live="polite"
    >
      <div className="clinic-status-indicator">
        <span className="clinic-status-dot" />
        <div>
          <h3>{status.title}</h3>
          <p>{status.description}</p>
        </div>
      </div>

      <small>
        Based on the sample clinic schedule. Confirm official hours
        with St. Peter's College.
      </small>
    </section>
  );
}

export default ClinicStatus;

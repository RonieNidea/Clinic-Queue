
import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import '../Appointments.css';

const DEPARTMENTS = [
  'General Medicine',
  'Nursing Assistance',
  'Basic First Aid',
  'Health Assessment',
];

// Get today's date in Philippine time as YYYY-MM-DD.
const today = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
};

// Safely format dates from either YYYY-MM-DD or Laravel ISO date values.
const dateLabel = (date) => {
  if (!date) return 'Date not available';

  const datePart = String(date).slice(0, 10);
  const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return 'Date not available';

  const [, year, month, day] = match;
  const parsedDate = new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  );

  // Prevent invalid calendar dates from being displayed.
  if (
    parsedDate.getFullYear() !== Number(year) ||
    parsedDate.getMonth() !== Number(month) - 1 ||
    parsedDate.getDate() !== Number(day)
  ) {
    return 'Date not available';
  }

  return parsedDate.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format time values such as 11:00 or 11:00:00.
const timeLabel = (time) => {
  if (!time) return 'Time not available';

  const match = String(time).match(/^(\d{1,2}):(\d{2})/);

  if (!match) return 'Time not available';

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return 'Time not available';
  }

  const parsedTime = new Date(2000, 0, 1, hours, minutes);

  return parsedTime.toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const Appointments = ({ user, openPage }) => {
  const [appointments, setAppointments] = useState([]);
  const [appointmentDate, setAppointmentDate] = useState(today());
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [patientName, setPatientName] = useState(user?.name || '');
  const [reason, setReason] = useState('');

  const [availableSlots, setAvailableSlots] = useState([]);
  const [unavailableSlots, setUnavailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Keep the patient name synchronized if the user information loads later.
  useEffect(() => {
    if (user?.name) {
      setPatientName(user.name);
    }
  }, [user?.name]);

  // Retrieve the logged-in user's appointments.
  const loadAppointments = async () => {
    setLoadingAppointments(true);

    try {
      const data = await apiRequest('/appointments');
      setAppointments(
        Array.isArray(data.appointments) ? data.appointments : []
      );
    } catch (err) {
      setError(err.message || 'Unable to load appointments.');
    } finally {
      setLoadingAppointments(false);
    }
  };

  // Retrieve available and unavailable time slots for the selected date
  // and department. The backend handles weekday, Saturday, and Sunday rules.
  const loadSlots = async (date = appointmentDate, dept = department) => {
    if (!date || !dept) return;

    setLoadingSlots(true);
    setSelectedTime('');
    setAvailableSlots([]);
    setUnavailableSlots([]);

    try {
      const query = new URLSearchParams({
        appointment_date: date,
        department: dept,
      });

      const data = await apiRequest(
        `/appointments/available-slots?${query.toString()}`
      );

      setAvailableSlots(
        Array.isArray(data.available_slots) ? data.available_slots : []
      );

      setUnavailableSlots(
        Array.isArray(data.unavailable_slots) ? data.unavailable_slots : []
      );

      if (data.message) {
        setMessage(data.message);
      }
    } catch (err) {
      setAvailableSlots([]);
      setUnavailableSlots([]);
      setError(err.message || 'Unable to load available time slots.');
    } finally {
      setLoadingSlots(false);
    }
  };

  // Load appointments when the page opens.
  useEffect(() => {
    loadAppointments();
  }, []);

  // Refresh time slots when the date or department changes.
  useEffect(() => {
    setMessage('');
    setError('');
    loadSlots(appointmentDate, department);
  }, [appointmentDate, department]);

  // Submit a new appointment to the Laravel API.
  const handleBooking = async (event) => {
    event.preventDefault();

    setMessage('');
    setError('');

    if (!patientName.trim()) {
      setError('Please enter the patient name.');
      return;
    }

    if (!selectedTime) {
      setError('Please select an available appointment time.');
      return;
    }

    if (appointmentDate < today()) {
      setError('Please select today or a future date.');
      return;
    }

    setBooking(true);

    try {
      const data = await apiRequest('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          patient_name: patientName.trim(),
          department,
          appointment_date: appointmentDate,
          appointment_time: selectedTime,
          reason: reason.trim(),
        }),
      });

      setMessage(
        `${data.message || 'Appointment booked successfully.'} Your appointment is on ${dateLabel(appointmentDate)} at ${timeLabel(selectedTime)}.`
      );

      setSelectedTime('');
      setReason('');

      await Promise.all([
        loadAppointments(),
        loadSlots(appointmentDate, department),
      ]);
    } catch (err) {
      setError(err.message || 'Booking failed. Please try again.');
      await loadSlots(appointmentDate, department);
    } finally {
      setBooking(false);
    }
  };

  // Cancel an appointment and refresh the appointment list and time slots.
  const handleCancel = async (appointmentId) => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this appointment?'
    );

    if (!confirmed) return;

    setMessage('');
    setError('');

    try {
      const data = await apiRequest(
        `/appointments/${appointmentId}/cancel`,
        { method: 'PATCH' }
      );

      setMessage(data.message || 'Appointment cancelled successfully.');

      await Promise.all([
        loadAppointments(),
        loadSlots(appointmentDate, department),
      ]);
    } catch (err) {
      setError(err.message || 'Unable to cancel the appointment.');
    }
  };

  return (
    <main className="appointments-page">
      <section className="appointments-header">
        <div>
          <h1>Clinic Appointments</h1>
          <p>Book and manage your clinic appointments.</p>
        </div>

        {openPage && (
          <button
            type="button"
            className="appointments-back-button"
            onClick={() => openPage('dashboard')}
          >
            Back to Dashboard
          </button>
        )}
      </section>

      {message && (
        <div className="appointment-alert appointment-alert-success" role="status">
          {message}
        </div>
      )}

      {error && (
        <div className="appointment-alert appointment-alert-error" role="alert">
          {error}
        </div>
      )}

      <section className="appointment-card">
        <h2>Book an Appointment</h2>

        <form onSubmit={handleBooking}>
          <div className="appointment-form-group">
            <label htmlFor="patientName">Patient Name</label>
            <input
              id="patientName"
              type="text"
              value={patientName}
              onChange={(event) => setPatientName(event.target.value)}
              placeholder="Enter patient name"
              maxLength={255}
              required
            />
          </div>

          <div className="appointment-form-group">
            <label htmlFor="department">Department</label>
            <select
              id="department"
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              required
            >
              {DEPARTMENTS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="appointment-form-group">
            <label htmlFor="appointmentDate">Appointment Date</label>
            <input
              id="appointmentDate"
              type="date"
              value={appointmentDate}
              min={today()}
              onChange={(event) => setAppointmentDate(event.target.value)}
              required
            />
          </div>

          <div className="appointment-form-group">
            <label>Available Time Slots</label>

            {loadingSlots ? (
              <p>Loading available time slots...</p>
            ) : availableSlots.length > 0 ? (
              <div className="appointment-slots">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    className={
                      selectedTime === slot
                        ? 'appointment-slot selected'
                        : 'appointment-slot'
                    }
                    onClick={() => setSelectedTime(slot)}
                    aria-pressed={selectedTime === slot}
                  >
                    {timeLabel(slot)}
                  </button>
                ))}
              </div>
            ) : (
              <p>No available time slots for this date and department.</p>
            )}

            {unavailableSlots.length > 0 && (
              <div className="unavailable-slots">
                <p>Unavailable time slots:</p>
                <div className="appointment-slots">
                  {unavailableSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className="appointment-slot unavailable"
                      disabled
                    >
                      {timeLabel(slot)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="appointment-form-group">
            <label htmlFor="reason">Reason for Visit</label>
            <textarea
              id="reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Briefly describe your reason for visiting (optional)"
              rows={3}
              maxLength={1000}
            />
          </div>

          <button
            type="submit"
            className="appointment-submit-button"
            disabled={booking || loadingSlots || !selectedTime}
          >
            {booking ? 'Booking...' : 'Book Appointment'}
          </button>
        </form>
      </section>

      <section className="appointment-card">
        <h2>My Appointments</h2>

        {loadingAppointments ? (
          <p>Loading your appointments...</p>
        ) : appointments.length === 0 ? (
          <p>You do not have any appointments yet.</p>
        ) : (
          <div className="appointments-list">
            {appointments.map((appointment) => (
              <article
                className="appointment-item"
                key={appointment.id}
              >
                <div className="appointment-item-details">
                  <h3>{appointment.patient_name}</h3>

                  <p>
                    <strong>Department:</strong>{' '}
                    {appointment.department}
                  </p>

                  <p>
                    <strong>Date:</strong>{' '}
                    {dateLabel(appointment.appointment_date)}
                  </p>

                  <p>
                    <strong>Time:</strong>{' '}
                    {timeLabel(appointment.appointment_time)}
                  </p>

                  {appointment.reason && (
                    <p>
                      <strong>Reason:</strong> {appointment.reason}
                    </p>
                  )}

                  <p>
                    <strong>Status:</strong>{' '}
                    <span
                      className={`appointment-status ${appointment.status}`}
                    >
                      {appointment.status}
                    </span>
                  </p>
                </div>

                {appointment.status === 'booked' && (
                  <button
                    type="button"
                    className="appointment-cancel-button"
                    onClick={() => handleCancel(appointment.id)}
                  >
                    Cancel Appointment
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Appointments;

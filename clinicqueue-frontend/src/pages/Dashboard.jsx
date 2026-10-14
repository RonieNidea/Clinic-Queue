
import '../Dashboard.css';

function Dashboard({
  user,
  patientName,
  setPatientName,
  department,
  setDepartment,
  queues,
  queueLoading,
  loading,
  joinQueue,
}) {
  // Display the latest queue entry as the patient's current queue.
  const currentQueue = queues.length > 0 ? queues[0] : null;

  const waitingCount = queues.filter(
    (queue) => queue.status === 'waiting'
  ).length;

  const completedCount = queues.filter(
    (queue) => queue.status === 'completed'
  ).length;

  function formatDate(dateString) {
    if (!dateString) return 'Date unavailable';

    return new Date(dateString).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  function formatStatus(status) {
    if (!status) return 'Unknown';

    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  return (
    <main className="cq-dashboard">
      <div className="cq-dashboard-container">
        {/* Welcome section */}
        <section className="cq-welcome">
          <div>
            <p className="cq-eyebrow">PATIENT PORTAL</p>
            <h1>
              Welcome{user?.name ? `, ${user.name}` : ' back'}!
            </h1>
            <p>
              Manage your clinic queue and keep track of your visits.
            </p>
          </div>

          <div className="cq-welcome-icon" aria-hidden="true">
            +
          </div>
        </section>

        {/* Overview cards */}
        <section className="cq-stat-grid" aria-label="Queue overview">
          <article className="cq-stat-card">
            <div className="cq-stat-icon cq-icon-blue">Q</div>
            <div>
              <p>Current queue</p>
              <h2>
                {currentQueue ? `#${currentQueue.id}` : '--'}
              </h2>
              <span>
                {currentQueue
                  ? formatStatus(currentQueue.status)
                  : 'No active queue'}
              </span>
            </div>
          </article>

          <article className="cq-stat-card">
            <div className="cq-stat-icon cq-icon-orange">W</div>
            <div>
              <p>Waiting entries</p>
              <h2>{waitingCount}</h2>
              <span>Across your queue history</span>
            </div>
          </article>

          <article className="cq-stat-card">
            <div className="cq-stat-icon cq-icon-green">✓</div>
            <div>
              <p>Completed visits</p>
              <h2>{completedCount}</h2>
              <span>Marked as completed</span>
            </div>
          </article>
        </section>

        {/* Main dashboard columns */}
        <div className="cq-main-grid">
          <section className="cq-panel cq-current-panel">
            <div className="cq-panel-heading">
              <div>
                <p className="cq-eyebrow">YOUR VISIT</p>
                <h2>Current queue status</h2>
              </div>
              <span className="cq-heading-icon">Q</span>
            </div>

            {currentQueue ? (
              <div className="cq-current-content">
                <p className="cq-muted">Your queue entry ID</p>
                <div className="cq-queue-number">
                  #{currentQueue.id}
                </div>

                <span
                  className={`cq-status cq-status-${String(
                    currentQueue.status
                  ).toLowerCase()}`}
                >
                  {formatStatus(currentQueue.status)}
                </span>

                <div className="cq-queue-details">
                  <div>
                    <span>Patient name</span>
                    <strong>{currentQueue.patient_name}</strong>
                  </div>
                  <div>
                    <span>Department</span>
                    <strong>{currentQueue.department}</strong>
                  </div>
                  <div>
                    <span>Joined on</span>
                    <strong>
                      {formatDate(currentQueue.created_at)}
                    </strong>
                  </div>
                </div>

                <p className="cq-help-text">
                  Your displayed number is the queue entry ID. It is
                  not a live estimate of your position or waiting time.
                </p>
              </div>
            ) : (
              <div className="cq-empty-state">
                <div className="cq-empty-icon">Q</div>
                <h3>You haven't joined a queue yet</h3>
                <p>
                  Complete the form to create your first queue entry.
                </p>
              </div>
            )}
          </section>

          <section className="cq-panel cq-join-panel">
            <div className="cq-panel-heading">
              <div>
                <p className="cq-eyebrow">GET STARTED</p>
                <h2>Join a clinic queue</h2>
              </div>
              <span className="cq-heading-icon">+</span>
            </div>

            <p className="cq-panel-description">
              Enter your details below to register for a clinic queue.
            </p>

            <form className="cq-queue-form" onSubmit={joinQueue}>
              <label htmlFor="cq-patient-name">Patient name</label>
              <input
                id="cq-patient-name"
                type="text"
                value={patientName}
                onChange={(event) => setPatientName(event.target.value)}
                placeholder="Enter your full name"
                maxLength={255}
                required
              />

              <label htmlFor="cq-department">Department</label>
              <select
                id="cq-department"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                required
              >
                <option value="General Medicine">General Medicine</option>
                <option value="Nursing Assistance">Nursing Assistance</option>
                <option value="Basic First Aid">Basic First Aid</option>
                <option value="Health Assessment">Health Assessment</option>
              </select>

              <button
                className="cq-submit-button"
                type="submit"
                disabled={loading || queueLoading}
              >
                {loading || queueLoading
                  ? 'Processing...'
                  : 'Join Queue'}
                {!loading && !queueLoading && <span>→</span>}
              </button>
            </form>

            <div className="cq-privacy-note">
              <span aria-hidden="true">✓</span>
              Your queue entry is linked to your signed-in account.
            </div>
          </section>
        </div>

        {/* Queue history */}
        <section className="cq-panel cq-history-panel">
          <div className="cq-panel-heading cq-history-heading">
            <div>
              <p className="cq-eyebrow">YOUR RECORDS</p>
              <h2>Queue history</h2>
              <p className="cq-panel-description">
                Review the queue entries associated with your account.
              </p>
            </div>

            <span className="cq-history-count">
              {queues.length} {queues.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          {queueLoading && queues.length === 0 ? (
            <p className="cq-table-message">Loading your queue history...</p>
          ) : queues.length === 0 ? (
            <div className="cq-empty-history">
              Your queue history will appear here after you join a queue.
            </div>
          ) : (
            <div className="cq-table-wrapper">
              <table className="cq-history-table">
                <thead>
                  <tr>
                    <th>Entry ID</th>
                    <th>Patient</th>
                    <th>Department</th>
                    <th>Date joined</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {queues.map((queue) => (
                    <tr key={queue.id}>
                      <td className="cq-entry-id">#{queue.id}</td>
                      <td>{queue.patient_name}</td>
                      <td>{queue.department}</td>
                      <td>{formatDate(queue.created_at)}</td>
                      <td>
                        <span
                          className={`cq-status cq-status-${String(
                            queue.status
                          ).toLowerCase()}`}
                        >
                          {formatStatus(queue.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="cq-dashboard-footer">
          ClinicQueue · Your clinic visits, organized in one place.
        </p>
      </div>
    </main>
  );
}

export default Dashboard;

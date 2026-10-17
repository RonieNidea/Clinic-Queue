import { useEffect, useState } from 'react';
import './App.css';

import { apiRequest } from './services/api';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import StaffRecords from './pages/StaffRecords';

const emptyForm = {
  name: '',
  student_number: '',
  email: '',
  password: '',
  password_confirmation: '',
};

function App() {
  // Restore the saved authentication token.
  const [token, setToken] = useState(
    () => localStorage.getItem('clinicqueue_token') || ''
  );

  // Track the current page.
  const [page, setPage] = useState(() =>
    localStorage.getItem('clinicqueue_token') ? 'dashboard' : 'home'
  );

  // Authentication state.
  const [form, setForm] = useState({ ...emptyForm });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionChecking, setSessionChecking] = useState(true);

  // Success and error notifications.
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Clinic queue state.
  const [patientName, setPatientName] = useState('');
  const [department, setDepartment] = useState('General Medicine');
  const [queues, setQueues] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);

  // Load queue entries belonging to the logged-in user.
  async function loadQueues(authToken = token) {
    if (!authToken) {
      setQueues([]);
      return;
    }

    setQueueLoading(true);

    try {
      const data = await apiRequest('/queues', {
        method: 'GET',
        token: authToken,
      });

      setQueues(data.queues || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setQueueLoading(false);
    }
  }

  // Restore and verify the saved session when the app opens.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const savedToken = localStorage.getItem('clinicqueue_token');

      if (!savedToken) {
        if (!cancelled) {
          setToken('');
          setUser(null);
          setQueues([]);
          setPage('home');
          setSessionChecking(false);
        }
        return;
      }

      try {
        const account = await apiRequest('/user', {
          method: 'GET',
          token: savedToken,
        });

        const queueData = await apiRequest('/queues', {
          method: 'GET',
          token: savedToken,
        });

        if (!cancelled) {
          setToken(savedToken);
          setUser(account);
          setQueues(queueData.queues || []);
          setPage(account.role === 'staff' ? 'staff' : 'dashboard');
        }
      } catch {
        if (!cancelled) {
          localStorage.removeItem('clinicqueue_token');
          setToken('');
          setUser(null);
          setQueues([]);
          setPage('home');
        }
      } finally {
        if (!cancelled) {
          setSessionChecking(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  // Navigate between pages and clear old notifications.
  function openPage(nextPage) {
    if (nextPage === 'staff' && user?.role !== 'staff') {
      setError('Staff access is available only to authorized clinic staff.');
      return;
    }

    if (
      ['dashboard', 'appointments'].includes(nextPage) &&
      !token
    ) {
      setPage('login');
      setMessage('');
      setError('Please log in to access your clinic account.');
      return;
    }

    setPage(nextPage);
    setMessage('');
    setError('');

    if (nextPage === 'dashboard' && token) {
      loadQueues(token);
    }
  }

  // Update login and registration form fields.
  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  // Register a new account or log in to an existing account.
  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const isRegister = page === 'register';

      const data = await apiRequest(
        isRegister ? '/register' : '/login',
        {
          method: 'POST',
          body: JSON.stringify(
            isRegister
              ? form
              : {
                  email: form.email,
                  password: form.password,
                }
          ),
        }
      );

      if (!data.token) {
        throw new Error(
          'The server did not return an authentication token.'
        );
      }

      localStorage.setItem('clinicqueue_token', data.token);

      setToken(data.token);
      setUser(data.user || null);
      setForm({ ...emptyForm });
      setQueues([]);
      setPage(data.user?.role === 'staff' ? 'staff' : 'dashboard');

      setMessage(
        isRegister
          ? 'Your account was created successfully!'
          : 'You logged in successfully!'
      );

      await loadQueues(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Join the clinic's walk-in queue.
  async function joinQueue(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    setQueueLoading(true);

    try {
      await apiRequest('/queues', {
        method: 'POST',
        token,
        body: JSON.stringify({
          patient_name: patientName,
          department,
        }),
      });

      setPatientName('');
      setMessage('Successfully joined the clinic queue!');

      await loadQueues(token);
    } catch (err) {
      setError(err.message);
    } finally {
      setQueueLoading(false);
    }
  }

  // Update the status of a queue entry.
  async function updateQueueStatus(queueId, status) {
    setMessage('');
    setError('');
    setQueueLoading(true);

    try {
      await apiRequest(`/queues/${queueId}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ status }),
      });

      setMessage('Queue status updated successfully!');
      await loadQueues(token);
    } catch (err) {
      setError(err.message);
    } finally {
      setQueueLoading(false);
    }
  }

  // Log out and clear the local session.
  async function handleLogout() {
    setError('');
    setMessage('');
    setLoading(true);

    let logoutError = '';

    try {
      if (token) {
        await apiRequest('/logout', {
          method: 'POST',
          token,
        });
      }
    } catch (err) {
      logoutError = err.message;
    } finally {
      localStorage.removeItem('clinicqueue_token');

      setToken('');
      setUser(null);
      setQueues([]);
      setForm({ ...emptyForm });
      setPatientName('');
      setDepartment('General Medicine');
      setPage('home');
      setLoading(false);

      if (logoutError) {
        setError(`Logged out locally. Server response: ${logoutError}`);
      } else {
        setMessage('You have logged out successfully.');
      }
    }
  }

  // Share the common properties needed by the login and registration pages.
  const authProps = {
    form,
    handleChange,
    handleSubmit,
    openPage,
    loading,
  };

  return (
    <div className="app">
      <Navbar
        page={page}
        token={token}
        user={user}
        loading={loading}
        openPage={openPage}
        handleLogout={handleLogout}
      />

      {/* Application-wide success and error messages. */}
      {message && (
        <div className="notice success" role="status">
          {message}
        </div>
      )}

      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}

      {/* Avoid displaying a protected page before checking the session. */}
      {sessionChecking ? (
        <main className="auth-page">
          <p>Checking your session...</p>
        </main>
      ) : (
        <>
          {page === 'home' && (
            <Home
              token={token}
              openPage={openPage}
            />
          )}

          {page === 'login' && (
            <Login {...authProps} />
          )}

          {page === 'register' && (
            <Register {...authProps} />
          )}

          {page === 'dashboard' && (
            token ? (
              <Dashboard
                user={user}
                token={token}
                patientName={patientName}
                setPatientName={setPatientName}
                department={department}
                setDepartment={setDepartment}
                queues={queues}
                queueLoading={queueLoading}
                loading={loading}
                joinQueue={joinQueue}
                loadQueues={loadQueues}
                updateQueueStatus={updateQueueStatus}
                handleLogout={handleLogout}
              />
            ) : (
              <Login {...authProps} />
            )
          )}

          
          {page === 'appointments' && (
            token ? (
              <Appointments openPage={openPage} user={user} token={token} />
            ) : (
              <Login {...authProps} />
            )
          )}

          {page === 'staff' && (
            user?.role === 'staff' ? (
              <StaffRecords openPage={openPage} />
            ) : (
              <Dashboard
                user={user}
                patientName={patientName}
                setPatientName={setPatientName}
                department={department}
                setDepartment={setDepartment}
                queues={queues}
                queueLoading={queueLoading}
                loading={loading}
                joinQueue={joinQueue}
              />
            )
          )}
        </>
      )}

      <Footer openPage={openPage} />
    </div>
  );
}

export default App;
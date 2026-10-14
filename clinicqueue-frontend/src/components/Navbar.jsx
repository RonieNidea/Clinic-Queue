function Navbar({ page, token, loading, openPage, handleLogout }) {
  return (
    <header className="navbar">
      <a
        className="brand"
        href="#home"
        onClick={(event) => {
          event.preventDefault();
          openPage('home');
        }}
      >
        <span className="brand-icon">+</span>
        ClinicQueue
      </a>

        <nav>
        {token ? (
            <>
            <button
                type="button"
                className="secondary-button"
                onClick={() => openPage('appointments')}
            >
                Appointments
            </button>

            <button
                type="button"
                className="secondary-button"
                onClick={() => openPage('dashboard')}
            >
                My Dashboard
            </button>

            <button
                type="button"
                className="login-button"
                onClick={handleLogout}
                disabled={loading}
            >
                {loading ? 'Please wait...' : 'Log Out'}
            </button>
            </>
        ) : (
            <>
            {page === 'home' && (
                <>
                <a href="#services">Services</a>
                <a
                    href="#appointments"
                    onClick={(event) => {
                    event.preventDefault();
                    openPage('appointments');
                    }}
                >
                    Appointments
                </a>
                <a href="#announcements">Announcements</a>
                </>
            )}

            <button
                type="button"
                className="login-button"
                onClick={() => openPage('login')}
            >
                Log In
            </button>
            </>
        )}
        </nav>

    </header>
  );
}

export default Navbar;

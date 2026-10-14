function Footer({ openPage }) {
  return (
    <footer>
      <a
        className="brand footer-brand"
        href="#home"
        onClick={(event) => {
          event.preventDefault();
          openPage('home');
        }}
      >
        <span className="brand-icon">+</span>
        ClinicQueue
      </a>

      <p>Campus clinic appointments &amp; queue management.</p>
      <span>© 2026 ClinicQueue · St. Peter's College</span>
    </footer>
  );
}

export default Footer;
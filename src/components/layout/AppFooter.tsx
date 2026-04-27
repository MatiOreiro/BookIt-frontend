import { Link } from 'react-router-dom';

const AppFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer" id="footer">
      <div className="app-shell app-footer__inner">
        <div className="app-footer__brand">
          <Link to="/" className="app-brand app-brand--footer">
            <span className="app-brand__mark">✦</span>
            <span className="app-brand__text">BookIt</span>
          </Link>
          <p>
            Reservá salones con una experiencia elegante, clara y simple.
          </p>
        </div>

        <div className="app-footer__column">
          <h2>Explorar</h2>
          <Link to="/">Inicio</Link>
          <Link to="/login">Ingresar</Link>
          <Link to="/register">Registrarse</Link>
        </div>

        <div className="app-footer__column">
          <h2>Soporte</h2>
          <a href="mailto:hola@bookit.com">hola@bookit.com</a>
          <a href="tel:+5491123456789">+54 9 11 2345-6789</a>
          <span>Atención 24/7</span>
        </div>
      </div>

      <div className="app-shell app-footer__bottom">
        <span>© {year} BookIt. Todos los derechos reservados.</span>
        <span>Diseñado para eventos premium.</span>
      </div>
    </footer>
  );
};

export default AppFooter;

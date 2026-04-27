import { Link } from 'react-router-dom';

const RegisterChoicePage = () => {
  return (
    <div className="auth-container">
      <section className="register-choice" aria-labelledby="register-choice-title">
        <header className="register-choice__header">
          <p className="register-choice__kicker">Crear cuenta en BookIt</p>
          <h1 id="register-choice-title">¿Cómo querés registrarte?</h1>
          <p>
            Elegí el tipo de cuenta que mejor se adapte a tu objetivo y seguí con el
            formulario correspondiente.
          </p>
        </header>

        <div className="register-choice__grid">
          <article className="register-choice__card">
            <h2>Quiero registrarme como usuario</h2>
            <p>
              Buscá salones, compará opciones y gestioná tus reservas para eventos de forma
              simple y rápida.
            </p>
            <Link to="/register/user" className="app-button app-button--primary">
              Registrarme como usuario
            </Link>
          </article>

          <article className="register-choice__card">
            <h2>Quiero registrarme como salón</h2>
            <p>
              Publicá tu espacio, completá información de tu servicio y empezá a recibir
              solicitudes de clientes.
            </p>
            <Link to="/register/service" className="app-button app-button--primary">
              Registrarme como salón
            </Link>
          </article>
        </div>

        <p className="auth-footer register-choice__footer">
          ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
        </p>
      </section>
    </div>
  );
};

export default RegisterChoicePage;

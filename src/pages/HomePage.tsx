import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home-container">
      <section className="home-hero">
        <h1>Bienvenido a BookIt</h1>
        <p>
          La plataforma para gestionar salones de eventos y servicios
          complementarios.
        </p>

        {isAuthenticated ? (
          <div className="home-cta">
            <p>Hola, {user?.name}. ¿Qué querés hacer hoy?</p>
            <Link to="/services/register" className="btn-primary">
              Registrar un servicio
            </Link>
          </div>
        ) : (
          <div className="home-cta">
            <Link to="/register" className="btn-primary">
              Comenzar ahora
            </Link>
            <Link to="/login" className="btn-secondary">
              Ya tengo cuenta
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;

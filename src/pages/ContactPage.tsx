type Developer = {
  name: string;
  role: string;
  email: string;
  github: string;
  linkedin: string;
};

const developers: Developer[] = [
  {
    name: 'Matias Oreiro',
    role: 'Co-creador / Desarrollador',
    email: 'matiasdoreiro@gmail.com',
    github: 'https://github.com/MatiOreiro',
    linkedin: 'https://www.linkedin.com/in/matiasoreiro/',
  },
  {
    name: 'Matias Pietrafesa',
    role: 'Co-creador / Desarrollador',
    email: 'matiaspietrafesa1@gmail.com',
    github: 'https://github.com/matiaspietrafesa',
    linkedin: 'https://www.linkedin.com/in/matias-pietrafesa-47084b321/',
  },
];

const DevCard = ({ name, role, email, github, linkedin }: Developer) => (
  <article className="dev-card">
    <h3>{name}</h3>
    <p className="dev-card__role">{role}</p>
    <div className="dev-card__links">
      <a href={`mailto:${email}`}>{email}</a>
      <a href={github} target="_blank" rel="noreferrer">
        GitHub
      </a>
      <a href={linkedin} target="_blank" rel="noreferrer">
        LinkedIn
      </a>
    </div>
  </article>
);

const ContactPage = () => {
  return (
    <div className="contact-page">
      <section className="contact-page__header">
        <h1>Contacto</h1>
        <p>¿Tenés dudas o sugerencias? Escribinos o conocé al equipo que construyó BookIt.</p>
      </section>

      <section className="contact-page__general">
        <a href="mailto:hola@bookit.com">hola@bookit.com</a>
        <a href="tel:+5491123456789">+54 9 11 2345-6789</a>
        <span>Atención 24/7</span>
      </section>

      <section className="contact-page__team">
        <h2>Conocé al equipo</h2>
        <div className="contact-page__team-grid">
          {developers.map((dev) => (
            <DevCard key={dev.email} {...dev} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default ContactPage;

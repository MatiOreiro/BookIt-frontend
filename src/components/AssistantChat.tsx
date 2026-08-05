import { useState, type FormEvent } from 'react';
import { toast } from 'react-toastify';
import { askAssistant } from '../services/assistantService';
import bookitoAvatar from '../assets/bookito-mascot-avatar.png';
import bookitoFull from '../assets/bookito-mascot-full.png';

interface AssistantChatProps {
  serviceId: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

const AssistantChat = ({ serviceId }: AssistantChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pregunta, setPregunta] = useState('');
  const [isSending, setIsSending] = useState(false);
  // Solo presentacional: apaga el glow de "novedad" del botón flotante tras la primera apertura.
  const [hasBeenOpened, setHasBeenOpened] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = pregunta.trim();
    if (!trimmed || isSending) return;

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setPregunta('');
    setIsSending(true);

    try {
      const respuesta = await askAssistant(serviceId, trimmed);
      setMessages((prev) => [...prev, { role: 'assistant', text: respuesta || 'No obtuve una respuesta, probá de nuevo.' }]);
    } catch {
      toast.error('No pudimos consultar al asistente en este momento. Probá de nuevo en unos segundos.');
    } finally {
      setIsSending(false);
    }
  };

  const toggleClasses = [
    'assistant-chat__toggle',
    isOpen ? 'assistant-chat__toggle--active' : '',
    !isOpen && !hasBeenOpened ? 'assistant-chat__toggle--glow' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="assistant-chat">
      {isOpen && (
        <div className="assistant-chat__panel">
          <div className="assistant-chat__header">
          <img
            src={bookitoAvatar.src}
            alt="Bookito, asistente virtual con inteligencia artificial"
            width={72}
            height={72}
            className="assistant-chat__panel-mascot"
          />
            <div className="assistant-chat__header-text">
              <span className="assistant-chat__header-name">Bookito</span>
              <span className="assistant-chat__header-subtitle">Tu asistente con IA</span>
            </div>
            <button
              type="button"
              className="assistant-chat__close"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar chat"
            >
              ✕
            </button>
          </div>

          <div className="assistant-chat__messages">
            {messages.length === 0 && (
              <div className="assistant-chat__empty">
                <img
                  src={bookitoFull.src}
                  alt="Bookito, asistente virtual con inteligencia artificial"
                  width={140}
                  height={176}
                  className="assistant-chat__empty-mascot"
                />
                <p className="assistant-chat__empty-text">
                  Preguntame lo que quieras saber sobre esta publicación.
                </p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`assistant-chat__bubble assistant-chat__bubble--${message.role}`}
              >
                {message.text}
              </div>
            ))}

            {isSending && (
              <div className="assistant-chat__bubble assistant-chat__bubble--assistant assistant-chat__bubble--typing">
                Escribiendo...
              </div>
            )}
          </div>

          <form className="assistant-chat__form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              placeholder="Escribí tu pregunta..."
              maxLength={500}
              disabled={isSending}
            />
            <button type="submit" disabled={isSending || !pregunta.trim()}>
              Enviar
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className={toggleClasses}
        onClick={() => {
          setIsOpen((prev) => !prev);
          setHasBeenOpened(true);
        }}
        aria-label={isOpen ? 'Cerrar a Bookito, asistente virtual con inteligencia artificial' : 'Abrir a Bookito, asistente virtual con inteligencia artificial'}
      >
        {isOpen ? (
          <span className="assistant-chat__toggle-close" aria-hidden="true">✕</span>
        ) : (
          <span className="assistant-chat__toggle-content">
            <span className="assistant-chat__toggle-label">Preguntale a Bookito</span>
            <span className="assistant-chat__toggle-avatar-wrap">
              <img
                src={bookitoAvatar.src}
                alt="Bookito, asistente virtual con inteligencia artificial"
                width={76}
                height={76}
                className="assistant-chat__toggle-avatar"
              />
              {/*  <span className="ai-badge assistant-chat__toggle-badge" aria-hidden="true">
                <span className="ai-badge__sparkle">✨</span>IA
              </span> */}
            </span>
          </span>
        )}
      </button>
    </div>
  );
};

export default AssistantChat;

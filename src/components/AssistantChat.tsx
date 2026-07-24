import { useState, type FormEvent } from 'react';
import { toast } from 'react-toastify';
import { askAssistant } from '../services/assistantService';

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

  return (
    <div className="assistant-chat">
      {isOpen && (
        <div className="assistant-chat__panel">
          <div className="assistant-chat__header">
            <span>Asistente virtual</span>
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
              <p className="assistant-chat__empty">
                Preguntame lo que quieras saber sobre esta publicación.
              </p>
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
        className="assistant-chat__toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Cerrar asistente' : 'Abrir asistente'}
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
};

export default AssistantChat;

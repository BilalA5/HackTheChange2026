import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { requestReply } from '@/services/chat.js';
import { clearConversation, loadConversation, saveConversation } from '@/services/conversations.js';

const message = (from, text, extra) => ({ id: crypto.randomUUID(), from, text, at: Date.now(), ...extra });

const openingFor = (persona) => persona.opening.map((text) => message('them', text));

export function useConversation({ scenario, persona: personaKey, userId }) {
  const persona = scenario[personaKey];
  const thread = useMemo(
    () => ({ userId, scenarioId: scenario.id, persona: personaKey }),
    [userId, scenario.id, personaKey],
  );
  const [messages, setMessages] = useState(() => loadConversation(thread) ?? openingFor(persona));
  const [typing, setTyping] = useState(false);
  const latest = useRef(messages);
  latest.current = messages;

  useEffect(() => saveConversation(thread, messages), [thread, messages]);

  const post = useCallback((text, extra) => setMessages((current) => [...current, message('them', text, extra)]), []);

  const send = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const history = latest.current;
      setMessages((current) => [...current, message('me', trimmed)]);
      setTyping(true);
      try {
        const reply = await requestReply({ scenarioId: scenario.id, persona: personaKey, text: trimmed, history });
        post(reply);
      } finally {
        setTyping(false);
      }
    },
    [scenario.id, personaKey, post],
  );

  const reset = useCallback(() => {
    clearConversation(thread);
    setMessages(openingFor(persona));
  }, [thread, persona]);

  const said = new Set(messages.filter((m) => m.from === 'me').map((m) => m.text));
  const suggestions = persona.script.map((line) => line.say).filter((line) => !said.has(line));

  return { persona, messages, typing, send, post, reset, suggestions };
}

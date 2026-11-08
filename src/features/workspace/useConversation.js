import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { requestReply } from '@/services/chat.js';
import { clearConversation, loadConversation, saveConversation } from '@/services/conversations.js';

const message = (from, text, extra) => ({ id: crypto.randomUUID(), from, text, at: Date.now(), ...extra });

const openingFor = (persona) => persona.opening.map((text) => message('them', text));

export function useConversation({ scenario, persona: personaKey, userId }) {
  const persona = scenario[personaKey];
  const thread = useMemo(
    () => ({ userId, stopId: scenario.id, persona: personaKey }),
    [userId, scenario.id, personaKey],
  );
  const [messages, setMessages] = useState(() => openingFor(persona));
  const [loaded, setLoaded] = useState(false);
  const [typing, setTyping] = useState(false);
  const latest = useRef(messages);
  latest.current = messages;

  useEffect(() => {
    let active = true;
    loadConversation(thread)
      .then((saved) => active && saved?.length && setMessages(saved))
      .catch(console.error)
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, [thread]);

  useEffect(() => {
    if (loaded) saveConversation(thread, messages).catch(console.error);
  }, [loaded, thread, messages]);

  const post = useCallback((text, extra) => setMessages((current) => [...current, message('them', text, extra)]), []);

  const send = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const history = latest.current;
      setMessages((current) => [...current, message('me', trimmed)]);
      setTyping(true);
      try {
        post(await requestReply({ scenario, persona: personaKey, text: trimmed, history }));
      } finally {
        setTyping(false);
      }
    },
    [scenario, personaKey, post],
  );

  const reset = useCallback(() => {
    clearConversation(thread).catch(console.error);
    setMessages(openingFor(persona));
  }, [thread, persona]);

  const said = new Set(messages.filter((m) => m.from === 'me').map((m) => m.text));
  const suggestions = persona.script.map((line) => line.say).filter((line) => !said.has(line));

  return { persona, messages, typing, send, post, reset, suggestions, loaded };
}

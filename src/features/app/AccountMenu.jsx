import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/features/auth/auth-context.js';
import { clearAllConversations } from '@/services/conversations.js';
import { resetProgress } from '@/services/progress.js';
import InitialsAvatar from '@/shared/InitialsAvatar.jsx';
import { glass } from './board/glass.js';

export default function AccountMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menu = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (event) => {
      if (event.type === 'keydown' ? event.key === 'Escape' : !menu.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const run = (action) => async () => {
    setOpen(false);
    await action();
  };

  const items = [
    { label: 'Change my goal', action: () => navigate('/onboarding/role') },
    { label: 'Replay how Flint works', action: () => navigate('/onboarding/your-world') },
    {
      label: 'Reset my progress',
      action: async () => {
        await Promise.all([clearAllConversations(user.id), resetProgress(user.id)]);
        navigate('/app', { replace: true });
      },
    },
    {
      label: 'Sign out',
      action: async () => {
        await signOut();
        navigate('/', { replace: true });
      },
    },
  ];

  return (
    <div ref={menu} className="pointer-events-auto relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account"
        className="flex items-center gap-[10px] rounded-full py-1 pl-1 pr-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,.1)] transition hover:bg-white/[0.06]"
        style={glass}
      >
        <InitialsAvatar name={user.name} size={32} />
        <span className="max-w-[140px] truncate text-[13.5px] text-tx">{user.name.split(' ')[0]}</span>
      </button>
      {open && (
        <div
          role="menu"
          className="animate-menu absolute right-0 top-[calc(100%+8px)] z-50 w-[230px] overflow-hidden rounded-[16px] p-[6px] shadow-[inset_0_0_0_1px_rgba(255,255,255,.1),0_24px_50px_-20px_rgba(0,0,0,.9)]"
          style={glass}
        >
          <p className="m-0 truncate px-3 pb-2 pt-[6px] text-[12px] text-tx-3">{user.email}</p>
          {items.map(({ label, action }) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              onClick={run(action)}
              className="block w-full rounded-[10px] px-3 py-[9px] text-left text-[13.5px] text-tx-2 transition-colors hover:bg-white/[0.07] hover:text-tx"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

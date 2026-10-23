import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { getToken } from '../api/client';
import { getRechargeSummary } from '../api/credits';

// Quantas lojas avisaram que pagaram (informed) e quantos pedidos esperam
// pagamento (pending). Atualiza na hora via WebSocket e, como reserva, a
// cada 30 segundos.
const DEFAULT_VALUE = { counts: { informed: 0, pending: 0 }, version: 0, refresh: async () => {} };
const RechargeContext = createContext(DEFAULT_VALUE);

const POLLING_INTERVAL_MS = 30000;
const RECONNECT_DELAY_MS = 3000;

export function buildWsUrl(token) {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  const wsBase = apiBase.replace(/^http/, 'ws').replace(/\/api\/?$/, '');
  return `${wsBase}?token=${encodeURIComponent(token)}`;
}

// Bipe curto (sem arquivo de áudio) para chamar a atenção do admin.
function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
    osc.onended = () => ctx.close();
  } catch {
    // Navegador bloqueou o áudio: o destaque visual continua funcionando.
  }
}

export function RechargeProvider({ children }) {
  const { status } = useAuth();
  const [counts, setCounts] = useState({ informed: 0, pending: 0 });
  // Sobe a cada evento recebido; telas usam para recarregar a lista.
  const [version, setVersion] = useState(0);
  const timerRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      setCounts(await getRechargeSummary());
    } catch {
      // Best-effort: o destaque não é crítico a ponto de mostrar erro.
    }
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') {
      setCounts({ informed: 0, pending: 0 });
      return undefined;
    }
    refresh();
    const id = setInterval(refresh, POLLING_INTERVAL_MS);
    return () => clearInterval(id);
  }, [status, refresh]);

  useEffect(() => {
    if (status !== 'authenticated') return undefined;
    let cancelled = false;
    let ws;

    function connect() {
      const token = getToken();
      if (!token || typeof WebSocket === 'undefined') return;
      ws = new WebSocket(buildWsUrl(token));
      ws.onmessage = (evt) => {
        let payload;
        try {
          payload = JSON.parse(evt.data);
        } catch {
          return;
        }
        if (payload?.type === 'recharge:informed') beep();
        if (payload?.type === 'recharge:informed' || payload?.type === 'recharge:resolved') {
          refresh();
          setVersion((v) => v + 1);
        }
      };
      ws.onclose = () => {
        if (!cancelled) timerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };
      ws.onerror = () => ws.close();
    }

    connect();
    return () => {
      cancelled = true;
      clearTimeout(timerRef.current);
      ws?.close();
    };
  }, [status, refresh]);

  // Título da aba mostra quantos precisam de conferência.
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, '');
    document.title = counts.informed > 0 ? `(${counts.informed}) ${base}` : base;
  }, [counts.informed]);

  const value = useMemo(() => ({ counts, version, refresh }), [counts, version, refresh]);
  return <RechargeContext.Provider value={value}>{children}</RechargeContext.Provider>;
}

export function useRecharges() {
  return useContext(RechargeContext);
}

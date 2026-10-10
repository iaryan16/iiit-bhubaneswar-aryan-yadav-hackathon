import { useEffect, useRef, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export function useEventSource<T>(endpoint: string, eventName: string = 'message') {
  const [data, setData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [history, setHistory] = useState<T[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const url = `${API_BASE}${endpoint}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
    };

    es.onerror = () => {
      setIsConnected(false);
    };

    const handler = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data) as T;
        setData(parsed);
        setHistory((prev) => [parsed, ...prev.slice(0, 49)]); // keep latest 50
      } catch {
        // Ignored or non-JSON heartbeats
      }
    };

    if (eventName === 'message') {
      es.onmessage = handler;
    } else {
      es.addEventListener(eventName, handler);
    }

    return () => {
      es.close();
      setIsConnected(false);
    };
  }, [endpoint, eventName]);

  return { data, history, isConnected };
}

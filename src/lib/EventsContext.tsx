import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import * as storage from './storage';
import type { EventoCamEvent, NewEventInput } from './types';

interface EventsContextValue {
  ready: boolean;
  events: EventoCamEvent[];
  profileName: string;
  setProfileName: (name: string) => Promise<void>;
  createEvent: (input: NewEventInput) => Promise<EventoCamEvent>;
  joinEvent: (params: { code: string; name?: string; date?: string }) => Promise<EventoCamEvent>;
  deleteEvent: (eventId: string) => Promise<void>;
  getEvent: (eventId: string) => EventoCamEvent | undefined;
}

const EventsContext = createContext<EventsContextValue | null>(null);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [events, setEvents] = useState<EventoCamEvent[]>([]);
  const [profileName, setProfileNameState] = useState('');

  useEffect(() => {
    Promise.all([storage.loadEvents(), storage.loadProfileName()])
      .then(([loadedEvents, name]) => {
        setEvents(loadedEvents);
        setProfileNameState(name);
      })
      .finally(() => setReady(true));
  }, []);

  const setProfileName = useCallback(async (name: string) => {
    await storage.saveProfileName(name);
    setProfileNameState(name.trim());
  }, []);

  const createEvent = useCallback(async (input: NewEventInput) => {
    const event = await storage.createEvent(input);
    setEvents(await storage.loadEvents());
    return event;
  }, []);

  const joinEvent = useCallback(async (params: { code: string; name?: string; date?: string }) => {
    const event = await storage.joinEvent(params);
    setEvents(await storage.loadEvents());
    return event;
  }, []);

  const deleteEvent = useCallback(async (eventId: string) => {
    await storage.deleteEvent(eventId);
    setEvents(await storage.loadEvents());
  }, []);

  const getEvent = useCallback((eventId: string) => events.find((e) => e.id === eventId), [events]);

  const value = useMemo(
    () => ({ ready, events, profileName, setProfileName, createEvent, joinEvent, deleteEvent, getEvent }),
    [ready, events, profileName, setProfileName, createEvent, joinEvent, deleteEvent, getEvent],
  );

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}

export function useEvents(): EventsContextValue {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error('useEvents debe usarse dentro de <EventsProvider>');
  return ctx;
}

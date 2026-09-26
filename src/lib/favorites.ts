"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "apartments770:favorites";
const CHANGE_EVENT = "apartments770:favorites-changed";

function readFavoriteIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeFavoriteIds(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // localStorage unavailable (private mode, disabled storage) - favoriting
    // silently becomes a no-op rather than crashing the page.
  }
}

/**
 * Favorites are anonymous and device-local by design (no login) - stored
 * as a plain array of property ids in localStorage. The custom event
 * keeps every FavoriteButton/FavoritesButton instance on the page in sync
 * with each other, since localStorage writes don't trigger re-renders on
 * their own.
 */
export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    // Starting from [] and syncing here (rather than a lazy useState
    // initializer) keeps the client's first render matching the
    // server-rendered markup, avoiding a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFavoriteIds(readFavoriteIds());
    function handleChange() {
      setFavoriteIds(readFavoriteIds());
    }
    window.addEventListener(CHANGE_EVENT, handleChange);
    window.addEventListener("storage", handleChange);
    return () => {
      window.removeEventListener(CHANGE_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  const isFavorite = useCallback(
    (propertyId: string) => favoriteIds.includes(propertyId),
    [favoriteIds],
  );

  const toggleFavorite = useCallback((propertyId: string) => {
    const current = readFavoriteIds();
    const next = current.includes(propertyId)
      ? current.filter((id) => id !== propertyId)
      : [...current, propertyId];
    writeFavoriteIds(next);
  }, []);

  return { favoriteIds, isFavorite, toggleFavorite };
}

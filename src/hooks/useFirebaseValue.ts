"use client";

import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "@/lib/firebase";

/**
 * Subscribes to a Firebase Realtime Database path and keeps local
 * state in sync. Returns the raw value (or the provided fallback
 * while loading / when the path is empty).
 */
export function useFirebaseValue<T>(path: string, fallback: T): T {
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    const dbRef = ref(db, path);
    const unsubscribe = onValue(dbRef, (snap) => {
      setValue(snap.exists() ? (snap.val() as T) : fallback);
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  return value;
}

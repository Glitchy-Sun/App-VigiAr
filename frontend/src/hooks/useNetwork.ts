import { useEffect, useState } from "react";
import { Platform } from "react-native";

/** Reactive online/offline detection that works on native and web. */
export function useNetwork() {
  const [online, setOnline] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    async function probe() {
      try {
        if (Platform.OS === "web") {
          if (typeof navigator !== "undefined" && "onLine" in navigator) {
            if (mounted) setOnline(Boolean((navigator as Navigator).onLine));
            return;
          }
        }

        const response = await fetch("https://www.google.com/generate_204", {
          method: "HEAD",
          cache: "no-store",
        });

        if (mounted) setOnline(response.ok);
      } catch {
        if (mounted) setOnline(false);
      }
    }

    void probe();

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const on = () => setOnline(true);
      const off = () => setOnline(false);
      window.addEventListener("online", on);
      window.addEventListener("offline", off);
      return () => {
        mounted = false;
        window.removeEventListener("online", on);
        window.removeEventListener("offline", off);
      };
    }

    const id = setInterval(probe, 5000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return online;
}

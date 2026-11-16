"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const byClock = () => {
  const hour = new Date().getHours();
  return hour < 5 ? "Good evening" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
};

// "Good morning, Hana" by the visitor's own clock. On the server it says "Welcome", so the server
// never guesses the time zone; the browser then swaps in the real greeting.
export function Greeting({ name, className }: { name: string; className?: string }) {
  const hello = useSyncExternalStore(subscribe, byClock, () => "Welcome");
  return (
    <h1 className={className}>
      {hello}
      {name ? `, ${name}` : ""}
    </h1>
  );
}

import type { Metadata } from "next";
import Deck from "./presenter";

export const metadata: Metadata = {
  title: "SecondLook | Presentation",
  description: "From a sales claim to an evidence brief. SecondLook product presentation and working demo.",
  robots: { index: false, follow: false },
};

export default function DeckPage() { return <Deck />; }

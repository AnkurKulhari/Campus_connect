import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Home | CampusConnect",
  description: "Private timeline and verified campus feed for Inderprastha Engineering College.",
};

export default function HomePage() {
  return <HomeClient />;
}

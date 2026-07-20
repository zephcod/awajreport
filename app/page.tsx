import { redirect } from "next/navigation";

// Middleware routes authenticated sessions before this renders;
// anyone landing here has no session.
export default function Home() {
  redirect("/login");
}

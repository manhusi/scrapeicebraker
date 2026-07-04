import { redirect } from "next/navigation";

// A kampányok a futószalagon élnek (UX.md v3) — a régi útvonal átirányít.
export default function CampaignsPage() {
  redirect("/");
}

import { redirect } from "next/navigation";

// A kampányok a home-on élnek (egy kampány = egy igazság, UX.md). A régi útvonal átirányít.
export default function CampaignsPage() {
  redirect("/");
}

"use client";

import { useParams } from "next/navigation";
import ProfileView from "../../components/ProfileView";

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  return <ProfileView userId={userId} />;
}

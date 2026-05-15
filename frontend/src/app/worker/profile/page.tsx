import { WorkerProfileForm } from "@/app/worker/profile/worker-profile-form";

export default function WorkerProfilePage() {
  return (
    <div className="hk-page-narrow">
      <p className="hk-eyebrow">Worker setup</p>
      <h1 className="hk-title">Worker profile</h1>
      <p className="hk-copy">
        Add CNIC and a photo URL (upload to your storage later). Pick skills — ratings build after customers complete
        jobs and review you.
      </p>
      <div className="mt-8">
        <WorkerProfileForm />
      </div>
    </div>
  );
}

import { NewJobForm } from "@/app/customer/jobs/new/new-job-form";

export default function NewJobPage() {
  return (
    <div className="hk-page-narrow">
      <p className="hk-eyebrow">Customer request</p>
      <h1 className="hk-title">Post a job</h1>
      <p className="hk-copy mb-8">Set the skill, area, budget, and optional GPS pin so workers can send offers.</p>
      <NewJobForm />
    </div>
  );
}

import { CompleteProfileForm } from "@/app/customer/complete-profile/profile-form";

export default function CustomerCompleteProfilePage() {
  return (
    <div className="hk-page-narrow">
      <p className="hk-eyebrow">Customer setup</p>
      <h1 className="hk-title">Complete your profile</h1>
      <p className="hk-copy mb-8">
        Add your city so workers can find jobs near you. Default country is Pakistan (PK); we will
        expand worldwide next.
      </p>
      <CompleteProfileForm />
    </div>
  );
}

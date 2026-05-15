import { JobRatingProvider } from "./job-rating-provider";

export default function CustomerJobIdLayout({ children }: { children: React.ReactNode }) {
  return <JobRatingProvider>{children}</JobRatingProvider>;
}

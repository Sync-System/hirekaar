export type JobBid = {
  id: string;
  worker_id: string;
  amount: number;
  message: string | null;
  eta: string | null;
  status: string;
};

export type JobDetail = {
  id: string;
  customer_id: string;
  assigned_worker_id?: string | null;
  assigned_worker?: {
    id: string;
    full_name: string;
    rating_avg: number;
    rating_count: number;
    avatar_url: string | null;
  } | null;
  site_lat?: number | null;
  site_lng?: number | null;
  title: string;
  description: string;
  category: string;
  city: string;
  area: string;
  budget_min: number;
  budget_max: number;
  recommended_price?: number;
  status: string;
  accepted_price_minor: number | null;
  platform_fee_minor: number | null;
  bids: JobBid[];
};

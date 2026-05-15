export interface Job {
  id: string;
  customer_id: string;
  assigned_worker_id?: string | null;
  title: string;
  description: string;
  category: string;
  city: string;
  area: string;
  budget_min: number;
  budget_max: number;
  recommended_price?: number;
  accepted_price_minor?: number | null;
  platform_fee_minor?: number | null;
  status: "open" | "in_progress" | "completed" | "cancelled";
  scheduled_at: string | null;
  created_at: string;
  request_expires_at?: string;
  bid?: {
    id: string;
    amount: number;
    message: string | null;
    eta: string | null;
    status: "pending" | "accepted" | "rejected";
    created_at: string;
  } | null;
}

export const CATEGORIES = [
  "electrician",
  "plumber",
  "cook",
  "carpenter",
  "cleaner",
  "painter",
  "ac_technician",
  "electronics_repair",
  "mason",
  "mechanic",
  "pet_care",
  "sanitation",
] as const;

export const CITIES = ["karachi", "lahore", "islamabad"] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<
  Category,
  { en: string; ur: string; emoji: string }
> = {
  electrician: { en: "Electrician", ur: "بجلی کا ماہر", emoji: "⚡" },
  plumber: { en: "Plumber", ur: "پلمبر", emoji: "🔧" },
  cook: { en: "Cook", ur: "باورچی", emoji: "🍳" },
  carpenter: { en: "Carpenter", ur: "بڑھئی", emoji: "🪚" },
  cleaner: { en: "Cleaner", ur: "صفائی کار", emoji: "🧹" },
  painter: { en: "Painter", ur: "پینٹر", emoji: "🎨" },
  ac_technician: { en: "AC technician", ur: "اے سی ٹیکنیشن", emoji: "❄️" },
  electronics_repair: {
    en: "Electronics repair",
    ur: "الیکٹرانکس مرمت",
    emoji: "📺",
  },
  mason: { en: "Mason", ur: "دیوار ساز", emoji: "🧱" },
  mechanic: { en: "Mechanic", ur: "مکینک", emoji: "🔩" },
  pet_care: { en: "Pet care", ur: "پالتو جانوروں کی دیکھ بھال", emoji: "🐾" },
  sanitation: { en: "Sanitation", ur: "صفائی و حفظان صحت", emoji: "🚿" },
};

import type {
  AccountStatus,
  WebsiteStatus,
  BusinessType,
  SalonUserRole,
} from "@/src/constants/salon";
import type { ActorType } from "@/src/constants/modules";

export type CreateSalonInput = {
  name: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerPassword?: string;
  businessType: BusinessType;
  address?: string;
  city: string;
  state: string;
  pincode?: string;
  gstNumber?: string;
  logoUrl?: string;
  slug?: string;
  trialDays?: number;
  planCode?: string;
};

export type UpdateSalonInput = {
  name?: string;
  slug?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  businessType?: BusinessType;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  logoUrl?: string;
  websiteStatus?: WebsiteStatus;
  currentPlanCode?: string;
};

export type SalonStatusInput = {
  accountStatus?: AccountStatus;
  websiteStatus?: WebsiteStatus;
  reason?: string;
};

export type CreateSalonUserInput = {
  name: string;
  email: string;
  phone: string;
  role: SalonUserRole;
  password?: string;
};

export type AuditLogInput = {
  actorType: ActorType;
  actorId: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  request?: Request | null;
};

export type PaginationResult = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

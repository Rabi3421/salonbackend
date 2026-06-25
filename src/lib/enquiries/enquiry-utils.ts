import type { EnquiryStatus } from "@/src/constants/enquiry";

const TRANSITIONS: Record<string, EnquiryStatus[]> = {
  new: ["contacted", "follow_up", "in_progress", "closed", "lost", "spam"],
  in_progress: ["contacted", "follow_up", "converted", "resolved", "closed", "lost"],
  contacted: ["follow_up", "converted", "closed", "lost"],
  follow_up: ["contacted", "converted", "closed", "lost"],
  converted: [],
  resolved: [],
  closed: ["follow_up"],
  lost: ["follow_up"],
  spam: [],
};

export function getAllowedNextEnquiryStatuses(
  status: string,
): EnquiryStatus[] {
  return TRANSITIONS[status] ?? [];
}

export function canTransitionEnquiryStatus(
  currentStatus: string,
  nextStatus: string,
): boolean {
  return getAllowedNextEnquiryStatuses(currentStatus).includes(
    nextStatus as EnquiryStatus,
  );
}

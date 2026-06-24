import { PLAN_MODULES, type PlanModule } from "@/src/constants/modules";

type ModulesInput = Partial<Record<PlanModule, boolean>>;

export type CreatePlanInput = {
  planCode: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  trialDays: number;
  maxStaff: number;
  maxBranches: number;
  maxAppointmentsPerMonth: number;
  modules: ModulesInput;
  isActive: boolean;
};

export type UpdatePlanInput = Omit<Partial<CreatePlanInput>, "planCode">;

type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; error: string };

const PLAN_CODE_REGEX = /^[a-zA-Z0-9_-]+$/;

function parseModules(raw: unknown): ModulesInput | null {
  if (!raw || typeof raw !== "object") return null;

  const result: ModulesInput = {};
  const obj = raw as Record<string, unknown>;

  for (const key of PLAN_MODULES) {
    if (key in obj) {
      result[key] = Boolean(obj[key]);
    }
  }

  const extraKeys = Object.keys(obj).filter(
    (k) => !PLAN_MODULES.includes(k as PlanModule),
  );

  if (extraKeys.length > 0) return null;

  return result;
}

export function validateCreatePlan(
  body: Record<string, unknown>,
): ValidationResult<CreatePlanInput> {
  if (!body.planCode || typeof body.planCode !== "string" || !body.planCode.trim()) {
    return { valid: false, error: "planCode is required." };
  }

  const planCode = body.planCode.trim().toUpperCase();

  if (!PLAN_CODE_REGEX.test(planCode)) {
    return { valid: false, error: "planCode may only contain letters, numbers, hyphens, and underscores." };
  }

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return { valid: false, error: "name is required." };
  }

  const monthlyPrice = Number(body.monthlyPrice ?? 0);
  if (isNaN(monthlyPrice) || monthlyPrice < 0) {
    return { valid: false, error: "monthlyPrice must be 0 or positive." };
  }

  const yearlyPrice = Number(body.yearlyPrice ?? 0);
  if (isNaN(yearlyPrice) || yearlyPrice < 0) {
    return { valid: false, error: "yearlyPrice must be 0 or positive." };
  }

  const trialDays = Number(body.trialDays ?? 14);
  if (isNaN(trialDays) || trialDays < 0) {
    return { valid: false, error: "trialDays must be 0 or positive." };
  }

  const maxStaff = Number(body.maxStaff ?? 5);
  if (isNaN(maxStaff) || maxStaff < 0) {
    return { valid: false, error: "maxStaff must be 0 or positive." };
  }

  const maxBranches = Number(body.maxBranches ?? 1);
  if (isNaN(maxBranches) || maxBranches < 1) {
    return { valid: false, error: "maxBranches must be at least 1." };
  }

  const maxAppointmentsPerMonth = Number(body.maxAppointmentsPerMonth ?? 0);
  if (isNaN(maxAppointmentsPerMonth) || maxAppointmentsPerMonth < 0) {
    return { valid: false, error: "maxAppointmentsPerMonth must be 0 or positive." };
  }

  let modules: ModulesInput = {};
  if (body.modules) {
    const parsed = parseModules(body.modules);
    if (!parsed) {
      return { valid: false, error: `Invalid modules. Allowed keys: ${PLAN_MODULES.join(", ")}` };
    }
    modules = parsed;
  }

  return {
    valid: true,
    data: {
      planCode,
      name: (body.name as string).trim(),
      description: body.description ? String(body.description).trim() : "",
      monthlyPrice,
      yearlyPrice,
      trialDays,
      maxStaff,
      maxBranches,
      maxAppointmentsPerMonth,
      modules,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    },
  };
}

export function validateUpdatePlan(
  body: Record<string, unknown>,
): ValidationResult<UpdatePlanInput> {
  const data: UpdatePlanInput = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return { valid: false, error: "name cannot be empty." };
    }
    data.name = body.name.trim();
  }

  if (body.description !== undefined) {
    data.description = String(body.description).trim();
  }

  if (body.monthlyPrice !== undefined) {
    const v = Number(body.monthlyPrice);
    if (isNaN(v) || v < 0) return { valid: false, error: "monthlyPrice must be 0 or positive." };
    data.monthlyPrice = v;
  }

  if (body.yearlyPrice !== undefined) {
    const v = Number(body.yearlyPrice);
    if (isNaN(v) || v < 0) return { valid: false, error: "yearlyPrice must be 0 or positive." };
    data.yearlyPrice = v;
  }

  if (body.trialDays !== undefined) {
    const v = Number(body.trialDays);
    if (isNaN(v) || v < 0) return { valid: false, error: "trialDays must be 0 or positive." };
    data.trialDays = v;
  }

  if (body.maxStaff !== undefined) {
    const v = Number(body.maxStaff);
    if (isNaN(v) || v < 0) return { valid: false, error: "maxStaff must be 0 or positive." };
    data.maxStaff = v;
  }

  if (body.maxBranches !== undefined) {
    const v = Number(body.maxBranches);
    if (isNaN(v) || v < 1) return { valid: false, error: "maxBranches must be at least 1." };
    data.maxBranches = v;
  }

  if (body.maxAppointmentsPerMonth !== undefined) {
    const v = Number(body.maxAppointmentsPerMonth);
    if (isNaN(v) || v < 0) return { valid: false, error: "maxAppointmentsPerMonth must be 0 or positive." };
    data.maxAppointmentsPerMonth = v;
  }

  if (body.modules !== undefined) {
    const parsed = parseModules(body.modules);
    if (!parsed) {
      return { valid: false, error: `Invalid modules. Allowed keys: ${PLAN_MODULES.join(", ")}` };
    }
    data.modules = parsed;
  }

  if (body.isActive !== undefined) {
    data.isActive = Boolean(body.isActive);
  }

  return { valid: true, data };
}

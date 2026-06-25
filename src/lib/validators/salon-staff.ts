type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; error: string };

const STAFF_ROLES = ["owner", "manager", "receptionist", "stylist", "accountant"] as const;
type StaffRole = (typeof STAFF_ROLES)[number];

const STAFF_STATUSES = ["active", "inactive", "on_leave"] as const;
type StaffStatus = (typeof STAFF_STATUSES)[number];

const EMPLOYMENT_TYPES = ["full_time", "part_time", "freelance", "contract"] as const;
type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type WorkingDayInput = {
  day: string;
  isWorking: boolean;
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
};

export type CreateStaffInput = {
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  designation: string;
  status: StaffStatus;
  employmentType: EmploymentType;
  avatar: string;
  experience: string;
  specialties: string[];
  assignedServiceIds: string[];
  assignedServiceNames: string[];
  workingDays: WorkingDayInput[];
  joiningDate: string | undefined;
  address: string;
  notes: string;
  salary: number;
  commissionPercent: number;
  emergencyContactName: string;
  emergencyContactPhone: string;
};

export type UpdateStaffInput = Partial<CreateStaffInput>;

function validateWorkingDays(days: unknown[]): WorkingDayInput[] {
  return days
    .filter((d): d is Record<string, unknown> => typeof d === "object" && d !== null)
    .map((d) => ({
      day: String(d.day ?? "").trim(),
      isWorking: d.isWorking === true,
      startTime: String(d.startTime ?? "10:00").trim(),
      endTime: String(d.endTime ?? "19:00").trim(),
      breakStart: d.breakStart ? String(d.breakStart).trim() : "",
      breakEnd: d.breakEnd ? String(d.breakEnd).trim() : "",
    }))
    .filter((d) => d.day.length > 0);
}

export function validateCreateStaffPayload(
  body: Record<string, unknown>,
): ValidationResult<CreateStaffInput> {
  if (!body.name || typeof body.name !== "string" || body.name.trim().length < 2) {
    return { valid: false, error: "name is required (min 2 characters)." };
  }
  if ((body.name as string).trim().length > 100) {
    return { valid: false, error: "name is too long (max 100 characters)." };
  }

  if (!body.email || typeof body.email !== "string") {
    return { valid: false, error: "email is required." };
  }
  const email = (body.email as string).toLowerCase().trim();
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, error: "Invalid email format." };
  }

  if (!body.phone || typeof body.phone !== "string" || body.phone.trim().length < 7) {
    return { valid: false, error: "phone is required (min 7 characters)." };
  }
  if ((body.phone as string).trim().length > 20) {
    return { valid: false, error: "phone is too long (max 20 characters)." };
  }

  if (!body.role || !STAFF_ROLES.includes(body.role as StaffRole)) {
    return { valid: false, error: `role is required. Allowed: ${STAFF_ROLES.join(", ")}` };
  }

  if (!body.designation || typeof body.designation !== "string" || body.designation.trim().length < 2) {
    return { valid: false, error: "designation is required (min 2 characters)." };
  }
  if ((body.designation as string).trim().length > 100) {
    return { valid: false, error: "designation is too long (max 100 characters)." };
  }

  let status: StaffStatus = "active";
  if (body.status !== undefined) {
    if (!STAFF_STATUSES.includes(body.status as StaffStatus)) {
      return { valid: false, error: `Invalid status. Allowed: ${STAFF_STATUSES.join(", ")}` };
    }
    status = body.status as StaffStatus;
  }

  let employmentType: EmploymentType = "full_time";
  if (body.employmentType !== undefined) {
    if (!EMPLOYMENT_TYPES.includes(body.employmentType as EmploymentType)) {
      return { valid: false, error: `Invalid employmentType. Allowed: ${EMPLOYMENT_TYPES.join(", ")}` };
    }
    employmentType = body.employmentType as EmploymentType;
  }

  if (body.experience && String(body.experience).trim().length > 100) {
    return { valid: false, error: "experience is too long (max 100 characters)." };
  }

  if (body.joiningDate && isNaN(Date.parse(String(body.joiningDate)))) {
    return { valid: false, error: "Invalid joiningDate format." };
  }

  if (body.salary !== undefined) {
    const salary = Number(body.salary);
    if (isNaN(salary) || salary < 0) {
      return { valid: false, error: "salary must be >= 0." };
    }
  }

  if (body.commissionPercent !== undefined) {
    const cp = Number(body.commissionPercent);
    if (isNaN(cp) || cp < 0 || cp > 100) {
      return { valid: false, error: "commissionPercent must be 0–100." };
    }
  }

  if (body.address && String(body.address).trim().length > 500) {
    return { valid: false, error: "address is too long (max 500 characters)." };
  }
  if (body.notes && String(body.notes).trim().length > 1000) {
    return { valid: false, error: "notes is too long (max 1000 characters)." };
  }
  if (body.emergencyContactName && String(body.emergencyContactName).trim().length > 100) {
    return { valid: false, error: "emergencyContactName is too long (max 100 characters)." };
  }
  if (body.emergencyContactPhone) {
    const ecp = String(body.emergencyContactPhone).trim();
    if (ecp.length < 7 || ecp.length > 20) {
      return { valid: false, error: "emergencyContactPhone must be 7–20 characters." };
    }
  }

  return {
    valid: true,
    data: {
      name: (body.name as string).trim(),
      email,
      phone: (body.phone as string).trim(),
      role: body.role as StaffRole,
      designation: (body.designation as string).trim(),
      status,
      employmentType,
      avatar: body.avatar ? String(body.avatar).trim() : "",
      experience: body.experience ? String(body.experience).trim() : "",
      specialties: Array.isArray(body.specialties)
        ? (body.specialties as string[]).map((s) => String(s).trim())
        : [],
      assignedServiceIds: Array.isArray(body.assignedServiceIds)
        ? (body.assignedServiceIds as string[]).map(String)
        : [],
      assignedServiceNames: Array.isArray(body.assignedServiceNames)
        ? (body.assignedServiceNames as string[]).map((s) => String(s).trim())
        : [],
      workingDays: Array.isArray(body.workingDays)
        ? validateWorkingDays(body.workingDays as unknown[])
        : [],
      joiningDate: body.joiningDate ? String(body.joiningDate) : undefined,
      address: body.address ? String(body.address).trim() : "",
      notes: body.notes ? String(body.notes).trim() : "",
      salary: body.salary !== undefined ? Number(body.salary) : 0,
      commissionPercent: body.commissionPercent !== undefined ? Number(body.commissionPercent) : 0,
      emergencyContactName: body.emergencyContactName ? String(body.emergencyContactName).trim() : "",
      emergencyContactPhone: body.emergencyContactPhone ? String(body.emergencyContactPhone).trim() : "",
    },
  };
}

export function validateUpdateStaffPayload(
  body: Record<string, unknown>,
): ValidationResult<UpdateStaffInput> {
  const data: UpdateStaffInput = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length < 2) {
      return { valid: false, error: "name must be at least 2 characters." };
    }
    if (body.name.trim().length > 100) {
      return { valid: false, error: "name is too long (max 100 characters)." };
    }
    data.name = body.name.trim();
  }

  if (body.email !== undefined) {
    const email = String(body.email).toLowerCase().trim();
    if (!EMAIL_REGEX.test(email)) {
      return { valid: false, error: "Invalid email format." };
    }
    data.email = email;
  }

  if (body.phone !== undefined) {
    if (typeof body.phone !== "string" || body.phone.trim().length < 7) {
      return { valid: false, error: "phone must be at least 7 characters." };
    }
    if (body.phone.trim().length > 20) {
      return { valid: false, error: "phone is too long (max 20 characters)." };
    }
    data.phone = body.phone.trim();
  }

  if (body.role !== undefined) {
    if (!STAFF_ROLES.includes(body.role as StaffRole)) {
      return { valid: false, error: `Invalid role. Allowed: ${STAFF_ROLES.join(", ")}` };
    }
    data.role = body.role as StaffRole;
  }

  if (body.designation !== undefined) {
    if (typeof body.designation !== "string" || body.designation.trim().length < 2) {
      return { valid: false, error: "designation must be at least 2 characters." };
    }
    data.designation = body.designation.trim();
  }

  if (body.status !== undefined) {
    if (!STAFF_STATUSES.includes(body.status as StaffStatus)) {
      return { valid: false, error: `Invalid status. Allowed: ${STAFF_STATUSES.join(", ")}` };
    }
    data.status = body.status as StaffStatus;
  }

  if (body.employmentType !== undefined) {
    if (!EMPLOYMENT_TYPES.includes(body.employmentType as EmploymentType)) {
      return { valid: false, error: `Invalid employmentType. Allowed: ${EMPLOYMENT_TYPES.join(", ")}` };
    }
    data.employmentType = body.employmentType as EmploymentType;
  }

  if (body.avatar !== undefined) data.avatar = String(body.avatar).trim();
  if (body.experience !== undefined) data.experience = String(body.experience).trim();
  if (body.address !== undefined) data.address = String(body.address).trim();
  if (body.notes !== undefined) data.notes = String(body.notes).trim();
  if (body.emergencyContactName !== undefined) data.emergencyContactName = String(body.emergencyContactName).trim();
  if (body.emergencyContactPhone !== undefined) data.emergencyContactPhone = String(body.emergencyContactPhone).trim();

  if (body.joiningDate !== undefined) {
    if (body.joiningDate && isNaN(Date.parse(String(body.joiningDate)))) {
      return { valid: false, error: "Invalid joiningDate format." };
    }
    data.joiningDate = body.joiningDate ? String(body.joiningDate) : undefined;
  }

  if (body.salary !== undefined) {
    const salary = Number(body.salary);
    if (isNaN(salary) || salary < 0) return { valid: false, error: "salary must be >= 0." };
    data.salary = salary;
  }

  if (body.commissionPercent !== undefined) {
    const cp = Number(body.commissionPercent);
    if (isNaN(cp) || cp < 0 || cp > 100) return { valid: false, error: "commissionPercent must be 0–100." };
    data.commissionPercent = cp;
  }

  if (body.specialties !== undefined) {
    data.specialties = Array.isArray(body.specialties)
      ? (body.specialties as string[]).map((s) => String(s).trim())
      : [];
  }

  if (body.assignedServiceIds !== undefined) {
    data.assignedServiceIds = Array.isArray(body.assignedServiceIds)
      ? (body.assignedServiceIds as string[]).map(String)
      : [];
  }

  if (body.assignedServiceNames !== undefined) {
    data.assignedServiceNames = Array.isArray(body.assignedServiceNames)
      ? (body.assignedServiceNames as string[]).map((s) => String(s).trim())
      : [];
  }

  if (body.workingDays !== undefined) {
    data.workingDays = Array.isArray(body.workingDays)
      ? validateWorkingDays(body.workingDays as unknown[])
      : [];
  }

  return { valid: true, data };
}

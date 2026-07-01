"use client";

import Link from "next/link";
import { useEffect, useReducer, useState } from "react";
import { useParams } from "next/navigation";

import {
  getSalon,
  getSalonUsers,
  createSalonUser,
  resetSalonUserPassword,
  type SalonUserRecord,
  type CreateSalonUserPayload,
} from "@/src/lib/superadmin-api";
import { StatusBadge } from "@/src/components/superadmin/StatusBadge";
import { CopyButton } from "@/src/components/superadmin/CopyButton";
import { LoadingState } from "@/src/components/superadmin/LoadingState";
import { ErrorState } from "@/src/components/superadmin/ErrorState";
import { EmptyState } from "@/src/components/superadmin/EmptyState";

type UsersState = {
  salonName: string;
  users: SalonUserRecord[];
  loading: boolean;
  error: string;
  fetchKey: number;
};

type UsersAction =
  | { type: "FETCH_SUCCESS"; salonName: string; users: SalonUserRecord[] }
  | { type: "FETCH_ERROR"; error: string }
  | { type: "REFETCH" };

function usersReducer(state: UsersState, action: UsersAction): UsersState {
  switch (action.type) {
    case "FETCH_SUCCESS":
      return { ...state, salonName: action.salonName, users: action.users, error: "", loading: false };
    case "FETCH_ERROR":
      return { ...state, error: action.error, loading: false };
    case "REFETCH":
      return { ...state, loading: true, error: "", fetchKey: state.fetchKey + 1 };
  }
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const INITIAL_USER_FORM: CreateSalonUserPayload = {
  name: "",
  email: "",
  phone: "",
  role: "salon_owner",
  password: "",
};

const USER_ROLE_OPTIONS = [
  { value: "salon_owner", label: "Salon Owner" },
  { value: "manager", label: "Manager" },
  { value: "receptionist", label: "Receptionist" },
  { value: "stylist", label: "Stylist" },
  { value: "accountant", label: "Accountant" },
];

export default function SalonUsersPage() {
  const params = useParams<{ salonId: string }>();
  const salonId = params.salonId;

  const [state, dispatch] = useReducer(usersReducer, {
    salonName: "",
    users: [],
    loading: true,
    error: "",
    fetchKey: 0,
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateSalonUserPayload>({
    ...INITIAL_USER_FORM,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [tempUserEmail, setTempUserEmail] = useState("");

  const [resetTarget, setResetTarget] = useState<SalonUserRecord | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetGeneratedPassword, setResetGeneratedPassword] = useState("");

  useEffect(() => {
    Promise.all([getSalon(salonId), getSalonUsers(salonId)])
      .then(([salonRes, usersRes]) => {
        dispatch({
          type: "FETCH_SUCCESS",
          salonName: salonRes.data?.salon.name ?? salonId,
          users: usersRes.data?.users ?? [],
        });
      })
      .catch((err: Error) => dispatch({ type: "FETCH_ERROR", error: err.message }));
  }, [salonId, state.fetchKey]);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    setTempPassword("");

    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;

      const res = await createSalonUser(salonId, payload);

      if (res.data?.temporaryPassword) {
        setTempPassword(res.data.temporaryPassword);
        setTempUserEmail(form.email);
      }

      setForm({ ...INITIAL_USER_FORM });
      setShowForm(false);
      dispatch({ type: "REFETCH" });
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function openResetDialog(user: SalonUserRecord) {
    setResetTarget(user);
    setResetNewPassword("");
    setResetConfirmPassword("");
    setResetError("");
    setResetMessage("");
    setResetGeneratedPassword("");
  }

  function closeResetDialog() {
    if (resetting) return;
    setResetTarget(null);
    setResetNewPassword("");
    setResetConfirmPassword("");
    setResetError("");
    setResetGeneratedPassword("");
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;

    const password = resetNewPassword.trim();

    if (password.length < 6) {
      setResetError("Password must be at least 6 characters.");
      return;
    }

    if (password !== resetConfirmPassword.trim()) {
      setResetError("Passwords do not match.");
      return;
    }

    setResetting(true);
    setResetError("");

    try {
      await resetSalonUserPassword(salonId, resetTarget._id, {
        newPassword: password,
      });
      setResetMessage(`Password updated for ${resetTarget.email}.`);
      setResetTarget(null);
      setResetNewPassword("");
      setResetConfirmPassword("");
    } catch (err) {
      setResetError((err as Error).message);
    } finally {
      setResetting(false);
    }
  }

  async function handleGenerateResetPassword() {
    if (!resetTarget) return;

    setResetting(true);
    setResetError("");
    setResetGeneratedPassword("");

    try {
      const res = await resetSalonUserPassword(salonId, resetTarget._id);

      if (res.data?.temporaryPassword) {
        setResetGeneratedPassword(res.data.temporaryPassword);
        setResetMessage("");
      }
    } catch (err) {
      setResetError((err as Error).message);
    } finally {
      setResetting(false);
    }
  }

  const { salonName, users, loading, error } = state;

  if (loading) return <LoadingState message="Loading users..." />;
  if (error && users.length === 0) {
    return <ErrorState message={error} onRetry={() => dispatch({ type: "REFETCH" })} />;
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link
            href="/superadmin/dashboard/salons"
            className="hover:text-slate-700"
          >
            Salons
          </Link>
          <span>/</span>
          <Link
            href={`/superadmin/dashboard/salons/${salonId}`}
            className="hover:text-slate-700"
          >
            {salonName}
          </Link>
          <span>/</span>
          <span className="text-slate-900">Users</span>
        </div>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">
            Salon Users
          </h1>
          <button
            type="button"
            onClick={() => {
              setShowForm(!showForm);
              setFormError("");
            }}
            className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            {showForm ? "Hide Form" : "Add User"}
          </button>
        </div>
      </section>

      {tempPassword ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <h3 className="text-sm font-semibold text-amber-800">
            Temporary password for {tempUserEmail}
          </h3>
          <p className="mt-1 text-xs text-amber-700">
            This password is shown only once. Copy it now.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="rounded bg-white px-3 py-1.5 font-mono text-sm text-slate-900">
              {tempPassword}
            </code>
            <CopyButton text={tempPassword} />
          </div>
          <button
            type="button"
            onClick={() => setTempPassword("")}
            className="mt-3 text-xs font-medium text-amber-700 underline"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {resetMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
          <h3 className="text-sm font-semibold text-emerald-800">
            Password reset successfully
          </h3>
          <p className="mt-1 text-xs text-emerald-700">{resetMessage}</p>
          <button
            type="button"
            onClick={() => setResetMessage("")}
            className="mt-3 text-xs font-medium text-emerald-700 underline"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {showForm ? (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            Add new user
          </h2>
          <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="10-digit Indian mobile"
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Role *
                </label>
                <select
                  value={form.role}
                  onChange={(e) => updateField("role", e.target.value)}
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {USER_ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                value={form.password ?? ""}
                onChange={(e) => updateField("password", e.target.value)}
                placeholder="Auto-generated if empty"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:max-w-md"
              />
            </div>

            {formError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            ) : null}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Creating..." : "Create User"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {users.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No users found"
              description="Add the first user for this salon."
              action={{
                label: "Add User",
                onClick: () => setShowForm(true),
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                    Name
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                    Email
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                    Phone
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                    Role
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                    Active
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                    Last Login
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                    Created
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                      {user.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {user.email}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {user.phone}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="capitalize text-slate-700">
                        {user.role.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge
                        value={user.isActive ? "active" : "inactive"}
                        type="website"
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {formatDate(user.lastLoginAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openResetDialog(user)}
                        className="rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                      >
                        Reset Password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {resetTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={closeResetDialog}
          />
          <form
            onSubmit={handleResetPassword}
            className="relative mx-4 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
          >
            <h3 className="text-base font-semibold text-slate-900">
              Reset password
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Set a password manually or generate a temporary password for{" "}
              {resetTarget.name} ({resetTarget.email}).
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  New password
                </label>
                <input
                  type="password"
                  value={resetNewPassword}
                  onChange={(e) => {
                    setResetNewPassword(e.target.value);
                    setResetError("");
                  }}
                  minLength={6}
                  required
                  autoFocus
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Confirm password
                </label>
                <input
                  type="password"
                  value={resetConfirmPassword}
                  onChange={(e) => {
                    setResetConfirmPassword(e.target.value);
                    setResetError("");
                  }}
                  minLength={6}
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {resetError ? (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {resetError}
              </div>
            ) : null}

            {resetGeneratedPassword ? (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
                <h4 className="text-sm font-semibold text-amber-800">
                  New temporary password
                </h4>
                <p className="mt-1 text-xs text-amber-700">
                  This password is shown only once. Copy it now.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <code className="rounded bg-white px-3 py-1.5 font-mono text-sm text-slate-900">
                    {resetGeneratedPassword}
                  </code>
                  <CopyButton text={resetGeneratedPassword} />
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleGenerateResetPassword}
                disabled={resetting}
                className="rounded-lg border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-60"
              >
                {resetting ? "Processing..." : "Generate Temporary"}
              </button>
              <button
                type="button"
                onClick={closeResetDialog}
                disabled={resetting}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={resetting}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {resetting ? "Saving..." : "Set Password"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

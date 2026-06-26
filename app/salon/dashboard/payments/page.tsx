"use client";

import { useEffect, useReducer } from "react";

import { CurrentPlanCard } from "@/src/components/salon/subscription/CurrentPlanCard";
import { PaymentDueCard } from "@/src/components/salon/subscription/PaymentDueCard";
import { PaymentHistoryTable } from "@/src/components/salon/subscription/PaymentHistoryTable";
import { PaymentInstructionsCard } from "@/src/components/salon/subscription/PaymentInstructionsCard";
import { SubscriptionStatusBanner } from "@/src/components/salon/subscription/SubscriptionStatusBanner";
import {
  fetchCurrentSubscription,
  fetchSubscriptionPayments,
  SalonApiError,
} from "@/src/lib/salon-api";
import type {
  SalonCurrentSubscription,
  SalonSubscriptionPaymentItem,
} from "@/src/types/salon-frontend";

type State = {
  subscription: SalonCurrentSubscription | null;
  payments: SalonSubscriptionPaymentItem[];
  loading: boolean;
  error: string;
  errorStatus: number | null;
  key: number;
};

type Action =
  | {
      type: "OK";
      subscription: SalonCurrentSubscription;
      payments: SalonSubscriptionPaymentItem[];
    }
  | { type: "ERR"; error: string; errorStatus: number | null }
  | { type: "RETRY" };

function reducer(state: State, action: Action): State {
  if (action.type === "OK") {
    return {
      ...state,
      subscription: action.subscription,
      payments: action.payments,
      loading: false,
      error: "",
      errorStatus: null,
    };
  }

  if (action.type === "ERR") {
    return {
      ...state,
      loading: false,
      error: action.error,
      errorStatus: action.errorStatus,
    };
  }

  return { ...state, loading: true, error: "", errorStatus: null, key: state.key + 1 };
}

function LoadingState() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto size-10 animate-spin rounded-full border-2 border-pink-200 border-t-pink-500" />
      <p className="mt-4 text-sm font-medium text-slate-600">Loading subscription payments...</p>
    </div>
  );
}

function ErrorState({
  message,
  status,
  onRetry,
}: {
  message: string;
  status: number | null;
  onRetry: () => void;
}) {
  const displayMessage = status === 403
    ? message.includes("blocked")
      ? "Your access is currently blocked. Please contact support to complete payment."
      : "You do not have permission to view subscription payments."
    : message;

  return (
    <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Unable to load payments</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">{displayMessage}</p>
      {status !== 401 ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-xl bg-pink-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-pink-600"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

function ContactSupportCard() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-pink-600">Contact Support</p>
      <h2 className="mt-1 text-xl font-semibold text-slate-900">After payment</h2>
      <p className="mt-4 text-sm leading-6 text-slate-600">
        After payment, please share transaction proof with support. Superadmin will verify and reactivate your access if required.
      </p>
      <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Support contact details will be shared by the SalonFlow team.
      </p>
    </section>
  );
}

export default function SalonPaymentsPage() {
  const [state, dispatch] = useReducer(reducer, {
    subscription: null,
    payments: [],
    loading: true,
    error: "",
    errorStatus: null,
    key: 0,
  });

  useEffect(() => {
    let active = true;

    Promise.all([fetchCurrentSubscription(), fetchSubscriptionPayments()])
      .then(([subscriptionResponse, paymentsResponse]) => {
        if (!active) return;
        if (!subscriptionResponse.data) {
          dispatch({ type: "ERR", error: "Subscription not found.", errorStatus: 404 });
          return;
        }
        dispatch({
          type: "OK",
          subscription: subscriptionResponse.data,
          payments: paymentsResponse.data?.payments ?? [],
        });
      })
      .catch((error: Error) => {
        if (!active) return;
        const status = error instanceof SalonApiError ? error.status : null;
        dispatch({ type: "ERR", error: error.message, errorStatus: status });
      });

    return () => {
      active = false;
    };
  }, [state.key]);

  return (
    <div className="space-y-6 p-5 lg:p-8">
      <section>
        <p className="text-sm font-medium text-pink-600">Subscription</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Payments &amp; Subscription
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          View your current plan, due dates, and payment history
        </p>
      </section>

      {state.loading ? (
        <LoadingState />
      ) : state.error ? (
        <ErrorState
          message={state.error}
          status={state.errorStatus}
          onRetry={() => dispatch({ type: "RETRY" })}
        />
      ) : state.subscription ? (
        <>
          <SubscriptionStatusBanner subscription={state.subscription} />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
            <CurrentPlanCard subscription={state.subscription} />
            <div className="space-y-6">
              <PaymentDueCard subscription={state.subscription} />
              <PaymentInstructionsCard subscription={state.subscription} />
              <ContactSupportCard />
            </div>
          </div>

          <PaymentHistoryTable payments={state.payments} />
        </>
      ) : (
        <ErrorState
          message="Subscription not found."
          status={404}
          onRetry={() => dispatch({ type: "RETRY" })}
        />
      )}
    </div>
  );
}

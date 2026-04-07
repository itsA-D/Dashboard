"use client";

import { FormEvent, useEffect, useState } from "react";
import { PageShell } from "@/components/common/page-shell";
import {
  useCompanySettings,
  useCreateExpensePolicy,
  useExpensePolicies,
  useMyCompany,
  useToggleExpensePolicy,
  useUpdateCompanySettings
} from "@/hooks/use-settings";

export default function SettingsPage() {
  const companyQuery = useMyCompany();
  const settingsQuery = useCompanySettings();
  const policiesQuery = useExpensePolicies();
  const updateSettings = useUpdateCompanySettings();
  const createPolicy = useCreateExpensePolicy();
  const togglePolicy = useToggleExpensePolicy();

  const [bankAccount, setBankAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [windowDays, setWindowDays] = useState("30");

  const [policyType, setPolicyType] = useState("amount_limit");
  const [policyRole, setPolicyRole] = useState("");
  const [policyCategory, setPolicyCategory] = useState("");
  const [policyValueJson, setPolicyValueJson] = useState('{"amount": 5000}');
  const [policyDescription, setPolicyDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const settings = settingsQuery.data;

  useEffect(() => {
    if (!settings) {
      return;
    }
    setBankAccount(settings.reimbursement_bank_account || "");
    setIfsc(settings.reimbursement_ifsc || "");
    setCurrency(settings.default_currency || "INR");
    setWindowDays(String(settings.expense_submission_window_days ?? 30));
  }, [settings]);

  function onSaveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateSettings.mutate({
      reimbursement_bank_account: bankAccount,
      reimbursement_ifsc: ifsc,
      default_currency: currency,
      expense_submission_window_days: Number(windowDays)
    });
  }

  function onCreatePolicy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    let value: Record<string, unknown>;
    try {
      value = JSON.parse(policyValueJson) as Record<string, unknown>;
    } catch {
      setFormError("Policy value must be valid JSON");
      return;
    }

    createPolicy.mutate({
      policy_type: policyType,
      applies_to_role: policyRole || undefined,
      applies_to_category: policyCategory || undefined,
      value,
      description: policyDescription || undefined
    });
  }

  return (
    <PageShell eyebrow="Company setup" title="Settings and policy workspace" description="Manage company reimbursement defaults and policy rules for expense validation.">
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[1.5rem] border border-white/60 bg-white/85 p-6 shadow-card">
          <h2 className="font-display text-2xl text-ink">Company Profile</h2>
          <p className="mt-1 text-sm text-slate">{companyQuery.data?.name || "Company profile"}</p>
          <div className="mt-4 space-y-1 text-sm text-slate">
            <p>Plan: <span className="font-semibold text-ink">{companyQuery.data?.plan || "starter"}</span></p>
            <p>GST: <span className="font-semibold text-ink">{companyQuery.data?.gst_number || "Not set"}</span></p>
            <p>PAN: <span className="font-semibold text-ink">{companyQuery.data?.pan_number || "Not set"}</span></p>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-white/60 bg-white/85 p-6 shadow-card">
          <h2 className="font-display text-2xl text-ink">Reimbursement Defaults</h2>
          <form className="mt-4 space-y-4" onSubmit={onSaveSettings}>
            <input
              className="min-h-12 w-full rounded-2xl border border-mist bg-paper px-4"
              value={bankAccount}
              onChange={(event) => setBankAccount(event.target.value)}
              placeholder="Reimbursement bank account"
            />
            <input
              className="min-h-12 w-full rounded-2xl border border-mist bg-paper px-4"
              value={ifsc}
              onChange={(event) => setIfsc(event.target.value)}
              placeholder="IFSC"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="min-h-12 w-full rounded-2xl border border-mist bg-paper px-4"
                value={currency}
                onChange={(event) => setCurrency(event.target.value.toUpperCase())}
                placeholder="Currency"
                maxLength={3}
              />
              <input
                className="min-h-12 w-full rounded-2xl border border-mist bg-paper px-4"
                value={windowDays}
                onChange={(event) => setWindowDays(event.target.value)}
                placeholder="Submission window (days)"
                type="number"
                min={1}
              />
            </div>
            <button className="min-h-12 rounded-full bg-ink px-5 text-sm font-semibold text-white" type="submit">
              {updateSettings.isPending ? "Saving..." : "Save Settings"}
            </button>
          </form>
        </section>

        <section className="rounded-[1.5rem] border border-white/60 bg-white/85 p-6 shadow-card xl:col-span-2">
          <h2 className="font-display text-2xl text-ink">Expense Policies</h2>
          <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onCreatePolicy}>
            <select className="min-h-12 rounded-2xl border border-mist bg-paper px-4" value={policyType} onChange={(event) => setPolicyType(event.target.value)}>
              <option value="amount_limit">Amount limit</option>
              <option value="receipt_required">Receipt required</option>
              <option value="duplicate_check">Duplicate check</option>
              <option value="weekend_block">Weekend block</option>
              <option value="category_block">Category block</option>
              <option value="auto_approve">Auto approve</option>
            </select>
            <input
              className="min-h-12 rounded-2xl border border-mist bg-paper px-4"
              value={policyRole}
              onChange={(event) => setPolicyRole(event.target.value)}
              placeholder="Applies to role (optional)"
            />
            <input
              className="min-h-12 rounded-2xl border border-mist bg-paper px-4"
              value={policyCategory}
              onChange={(event) => setPolicyCategory(event.target.value)}
              placeholder="Category (optional)"
            />
            <input
              className="min-h-12 rounded-2xl border border-mist bg-paper px-4"
              value={policyDescription}
              onChange={(event) => setPolicyDescription(event.target.value)}
              placeholder="Description"
            />
            <textarea
              className="min-h-24 rounded-2xl border border-mist bg-paper px-4 py-3 sm:col-span-2"
              value={policyValueJson}
              onChange={(event) => setPolicyValueJson(event.target.value)}
              placeholder='Value JSON, e.g. {"amount": 5000}'
            />
            {formError ? <p className="text-sm text-ember sm:col-span-2">{formError}</p> : null}
            <button className="min-h-12 rounded-full bg-ink px-5 text-sm font-semibold text-white sm:col-span-2" type="submit">
              {createPolicy.isPending ? "Creating..." : "Create Policy"}
            </button>
          </form>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-mist text-left text-slate">
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Value</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {(policiesQuery.data ?? []).map((policy) => (
                  <tr className="border-b border-mist/50" key={policy.id}>
                    <td className="px-3 py-2 font-medium text-ink">{policy.policy_type}</td>
                    <td className="px-3 py-2 text-slate">{policy.applies_to_role || "All"}</td>
                    <td className="px-3 py-2 text-slate">{policy.applies_to_category || "All"}</td>
                    <td className="px-3 py-2 text-slate">{JSON.stringify(policy.value)}</td>
                    <td className="px-3 py-2">
                      <button
                        className="rounded-full border border-mist px-3 py-1 text-xs font-semibold text-ink"
                        onClick={() => togglePolicy.mutate({ id: policy.id, is_active: !policy.is_active })}
                        type="button"
                      >
                        {policy.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

# Screens: purpose and states

| Screen (route) | Purpose | Key components and interactions | Empty state | Loading state | Error state |
|---|---|---|---|---|---|
| Landing (`#/`) | Say in 5 seconds what the product does and for whom | Headline, live passport preview, Strait of Gibraltar framing, 4-step sequence, supplier and buyer entry points | n/a | Instant (static) | n/a |
| Login | Target architecture only. The public demo has no login by design | Planned: passkey or email + MFA | n/a | n/a | n/a |
| Company context (`#/context`) | Capture context that drives applicability | Adaptive questions (EU questions appear only if EU is selected; remote-access question only if hosting is outside Morocco), chips, toggles, live result panel | Defaults to AtlasTech | Instant recalculation | Numeric inputs clamped; read-only notice for non-analyst roles |
| Requirements (`#/requirements`) | Show what may apply and why | Three jurisdiction columns, filter, expandable cards with condition, source, evidence chain to controls, risks and actions | "Nothing in this filter" with a hint to switch to All | Instant | Source links open in a new tab, no referrer |
| Data flows (`#/flows`) | Make cross-border processing visible | Flow lanes with flags, storage and access locations, findings and next steps, add-flow form | Prompt to add a flow | Instant | Form validation message when destination or purpose is missing |
| Evidence (`#/evidence`) | Show what a document proves and what is missing | Drop zone, 4 samples, step-by-step progress, per-control found/missing with excerpts, injection warning, validate or discard, risk impact | "No document analysed yet" with the recommended first sample | 4-step progress list | Not a PDF, too large, too many pages, no readable text, unsupported format: each with the reason and the fix |
| Fix first (`#/fix-first`) | Turn gaps into a short plan | CEO sentence with reasons, residual risk card, 4 KPIs, top 3 actions, 30/60/90 columns | "Nothing planned in this window" | Instant | n/a |
| Passport (`#/passport`) | Shareable trust document | Holder data, 4 scores, requirements, flows, risks, actions, evidence list, disclaimer, SHA-256, MRZ, print, copy summary | n/a | Hash shows "computing..." | Clipboard failure leaves the button unchanged |
| Supplier check (`#/supplier`) | EU buyer view | Supplier inputs, rating, reasons, tailored evidence request, copy as email | Works with no passport (assumes nothing is proven) | Instant | n/a |
| GRC workspace (`#/workspace`) | Detail for analysts and auditors | Risk register, controls and evidence, applicability matrix, NIST CSF 2.0, assessment (editable), audit trail | Tables always seeded | Instant | n/a |
| Method and security (`#/method`) | Explain formulas, AI use, legal data quality, threat model | Static panels and table | n/a | n/a | n/a |
| Organisation (`#/settings`) | Users, roles, tenant | Users list, permission matrix, tenant facts, reset | n/a | n/a | Reset asks for confirmation |

The compliance dashboard, ISO 27001 control matrix, risk register, executive dashboard and GRC dashboard from the original brief are covered by Fix first (executive) and the GRC workspace tabs.

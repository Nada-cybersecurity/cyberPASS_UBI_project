# Architecture

## 1. MVP (what is deployed)

A static single-page application. React 18 + TypeScript + Tailwind CSS, built with Vite, hash routing, state in React context persisted to the visitor's localStorage.

```
Browser
 ├─ UI (pages/, components/)
 ├─ Store (store.tsx): context, evidence register, answers, flows, role, audit trail
 ├─ Engines (engine/, pure functions, unit-tested)
 │   ├─ applicability: LegalRequirement.evaluate(context) -> status, reason, confidence
 │   ├─ risk: inherent = L x I; residual = inherent x (1 - weighted mean control effectiveness)
 │   ├─ prioritisation: severity-weighted risk reduction x legal relevance / (effort x cost)
 │   ├─ scoring: weighted 14-question maturity score
 │   ├─ flows: storage/access location vs EU adequacy and Moroccan transfer rules
 │   ├─ supplier: exposure (data x access) and key-control gaps
 │   └─ evidence: pdf.js text extraction + clause matching (design vs operation) + injection detection
 └─ Data (data/): legal knowledge base, ISO/NIST catalogue, AtlasTech seed, embedded sample PDFs
```

Why static for the competition: zero attack surface for a public URL, no uploads leave the device, no per-visitor cost, instant load, works offline as one HTML file.

## 2. Target production architecture

```
Next.js (React, TypeScript)  ──HTTPS──>  FastAPI (Python)  ──>  PostgreSQL 16 (row-level security)
                                            │                   Object storage (evidence, encrypted)
                                            ├─ Worker queue: file scanning (ClamAV), text extraction, AI analysis
                                            └─ AI provider abstraction (none | Anthropic | OpenAI | local model)
```

- **Rule engine stays deterministic** and moves server-side unchanged (TypeScript port to Python, same test vectors).
- **Jurisdiction packs:** each country is a data module (laws, requirements, rules, sources) behind the same `LegalRequirement` interface. Adding Tunisia or Senegal means adding a pack, not changing code.
- **Framework packs:** ISO 27001, NIST CSF 2.0, later SOC 2, CIS Controls, mapped through `framework_requirements` and `control_mappings`.

## 3. AI architecture

| Deterministic code | AI-assisted (proposal only) |
|---|---|
| Applicability, risk scoring, priorities, permissions, framework mappings, statuses, tenant isolation | Document classification, evidence extraction, control matching, summaries, plain-language explanations |

Guardrails:
1. Documents are passed to the model as quoted data inside a fixed JSON schema; the model never receives tools or instructions from documents.
2. Instruction-like content is detected before and after the model call and shown to the reviewer (already implemented in the rule-based analyser).
3. Model output is validated against the schema; unknown control IDs are dropped.
4. Every finding needs human validation before it changes a status; the audit trail records who validated what.
5. Per-tenant document isolation: one document per request, no cross-document context, no training on customer data.
6. Confidence is reported as high/medium/low derived from matched evidence elements, not as an uncalibrated model percentage.

## 4. Security model

| Threat | MVP | Production |
|---|---|---|
| Malicious uploads | Parsed in browser, magic-byte check, size/page limits, pdf.js eval disabled | Quarantine bucket, ClamAV scan, content disarm, isolated extraction workers, no execute permissions |
| Prompt injection | Detected, displayed, excluded from scoring | Plus schema-constrained model output and human validation |
| Data leakage / tenant isolation | Single demo tenant in the visitor's browser | `tenant_id` on every row, PostgreSQL RLS, tenant-scoped repositories, isolation tests in CI |
| Privilege escalation / broken access control | UI role preview | Server-side RBAC, deny by default, per-endpoint permission tests |
| Insecure APIs | No API | OpenAPI schema validation, pagination limits, rate limiting, CORS allow-list |
| Credential theft | No accounts | MFA or passkeys, HttpOnly Secure SameSite cookies, short sessions, rotation |
| SSRF | No server requests | No user-supplied URL fetching; egress allow-list |
| XSS | React escaping, no raw HTML, input sanitising, CSP in Docker image | Same plus Trusted Types |
| SQL injection | No database | ORM with parameterised queries only |
| Encryption | n/a | TLS 1.2+, AES-256 at rest, per-tenant data keys in a KMS |
| Audit | Client-side audit trail | Append-only `audit_logs` table, hash-chained |
| Secrets | None needed | Environment secrets from a vault; never in the repo |

## 5. Roles (RBAC)

| Role | Scope |
|---|---|
| Super admin | Platform operations, all tenants (break-glass, logged) |
| Company admin | Organisation settings and users |
| GRC analyst | Context, assessment, evidence validation, risks, actions |
| Executive | Read-only executive dashboard and passport |
| Auditor | Read-only registers and evidence |
| Employee | Assigned remediation tasks only |

## 6. Screens

See [SCREENS.md](SCREENS.md) for purpose, components, interactions and empty, loading and error states of each screen.

-- AfriEU CyberPass: target PostgreSQL 16 schema (production architecture).
-- The deployed MVP runs client-side; this schema is the server design it maps onto.
-- Multi-tenancy: every tenant-owned table has organization_id and a row-level security policy
-- keyed on the session setting app.current_org.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- ============ Reference data (global, read-only to tenants) ============
CREATE TABLE countries (
  code        char(2) PRIMARY KEY,
  name        text NOT NULL,
  eu_member   boolean NOT NULL DEFAULT false,
  eu_adequacy boolean NOT NULL DEFAULT false,
  adequacy_checked_on date
);

CREATE TABLE jurisdictions (
  id          text PRIMARY KEY,                 -- 'MA', 'EU'
  name        text NOT NULL,
  country_code char(2) REFERENCES countries(code)
);

CREATE TABLE laws (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id text NOT NULL REFERENCES jurisdictions(id),
  name            text NOT NULL,                -- 'Law 09-08'
  official_ref    text,                         -- 'Dahir 1-09-15, BO n° 5714'
  regulator       text,                         -- 'CNDP'
  source_url      text NOT NULL CHECK (source_url LIKE 'https://%'),
  UNIQUE (jurisdiction_id, name)
);

CREATE TYPE source_status AS ENUM ('verified', 'secondary', 'unverified_demo');
CREATE TYPE requirement_kind AS ENUM ('territorial', 'obligation', 'transfer', 'contractual', 'cybersecurity');

CREATE TABLE legal_requirements (
  id                  text PRIMARY KEY,         -- 'EU-GDPR-TRANSFER'
  law_id              uuid NOT NULL REFERENCES laws(id),
  scope               text NOT NULL CHECK (scope IN ('MA', 'EU', 'CROSS')),
  reference           text,                     -- article, only when verified
  title               text NOT NULL,
  summary             text NOT NULL,            -- our own words, never quoted text
  kind                requirement_kind NOT NULL,
  condition_text      text NOT NULL,
  source_url          text NOT NULL,
  source_status       source_status NOT NULL,
  checked_on          date NOT NULL,
  professional_review boolean NOT NULL DEFAULT false,
  version             int NOT NULL DEFAULT 1
);

CREATE TABLE applicability_rules (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id text NOT NULL REFERENCES legal_requirements(id) ON DELETE CASCADE,
  priority       int NOT NULL DEFAULT 100,      -- lower evaluates first
  expression     jsonb NOT NULL,                -- e.g. {"all":[{"fact":"euDataProcessed","eq":true},{"fact":"hosting","ne":"eu"}]}
  result_status  text NOT NULL CHECK (result_status IN ('applicable', 'review', 'not_applicable')),
  reason_template text NOT NULL,
  confidence     text NOT NULL CHECK (confidence IN ('high', 'medium', 'low'))
);
CREATE INDEX ON applicability_rules (requirement_id, priority);

CREATE TABLE frameworks (
  id      text PRIMARY KEY,                     -- 'ISO27001:2022', 'NIST-CSF-2.0'
  name    text NOT NULL,
  version text NOT NULL
);

CREATE TABLE framework_requirements (
  id           text PRIMARY KEY,                -- 'ISO27001:2022/A.8.5', 'NIST-CSF-2.0/PR.AA'
  framework_id text NOT NULL REFERENCES frameworks(id),
  code         text NOT NULL,
  title        text NOT NULL,                   -- own paraphrase for licensed standards
  UNIQUE (framework_id, code)
);

CREATE TABLE controls (                          -- platform control library
  id    text PRIMARY KEY,                       -- 'A.8.5'
  title text NOT NULL,
  theme text NOT NULL
);

CREATE TABLE control_mappings (
  control_id               text NOT NULL REFERENCES controls(id),
  framework_requirement_id text NOT NULL REFERENCES framework_requirements(id),
  PRIMARY KEY (control_id, framework_requirement_id)
);

CREATE TABLE requirement_controls (
  requirement_id text NOT NULL REFERENCES legal_requirements(id) ON DELETE CASCADE,
  control_id     text NOT NULL REFERENCES controls(id),
  PRIMARY KEY (requirement_id, control_id)
);

CREATE TABLE evidence_expectations (
  id         text PRIMARY KEY,
  control_id text NOT NULL REFERENCES controls(id),
  label      text NOT NULL,
  kind       text NOT NULL CHECK (kind IN ('design', 'operation')),
  patterns   text[] NOT NULL
);

CREATE TABLE questions (
  id         text PRIMARY KEY,
  topic      text NOT NULL,
  text       text NOT NULL,
  weight     int NOT NULL CHECK (weight BETWEEN 1 AND 20),
  severity   text NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  control_ids text[] NOT NULL
);

CREATE TABLE data_types (id text PRIMARY KEY, label text NOT NULL, sensitive boolean NOT NULL DEFAULT false);
CREATE TABLE user_types (id text PRIMARY KEY, label text NOT NULL);   -- employee, admin, contractor, supplier, customer
CREATE TABLE roles (id text PRIMARY KEY, label text NOT NULL);         -- super_admin, company_admin, grc_analyst, executive, auditor, employee
CREATE TABLE permissions (id text PRIMARY KEY, label text NOT NULL);
CREATE TABLE role_permissions (
  role_id       text NOT NULL REFERENCES roles(id),
  permission_id text NOT NULL REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

-- ============ Tenants ============
CREATE TABLE organizations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  country_code  char(2) NOT NULL REFERENCES countries(code),
  city          text,
  sector        text NOT NULL,
  employee_count int CHECK (employee_count >= 0),
  context       jsonb NOT NULL DEFAULT '{}',    -- full onboarding answers, versioned in assessments
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email           citext NOT NULL,
  display_name    text NOT NULL,
  role_id         text NOT NULL REFERENCES roles(id),
  user_type_id    text REFERENCES user_types(id),
  mfa_enabled     boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, email)
);

CREATE TABLE assets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  kind            text NOT NULL,                -- saas, database, laptop, cloud_account
  owner_user_id   uuid REFERENCES users(id),
  location_country char(2) REFERENCES countries(code)
);

CREATE TABLE suppliers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  country_code    char(2) REFERENCES countries(code),
  service         text,
  data_level      text CHECK (data_level IN ('none', 'business', 'personal', 'sensitive')),
  access_level    text CHECK (access_level IN ('none', 'limited', 'production', 'admin')),
  risk_level      text CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH'))
);

CREATE TABLE customers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  country_code    char(2) REFERENCES countries(code),
  is_financial_entity boolean NOT NULL DEFAULT false
);

CREATE TABLE processing_activities (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  purpose         text NOT NULL,
  role            text NOT NULL CHECK (role IN ('controller', 'processor', 'joint_controller')),
  data_type_ids   text[] NOT NULL,
  cndp_reference  text
);

CREATE TABLE data_flows (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  processing_activity_id uuid REFERENCES processing_activities(id),
  origin_label    text NOT NULL,
  origin_country  char(2) REFERENCES countries(code),
  destination_label text NOT NULL,
  data_type_id    text REFERENCES data_types(id),
  purpose         text NOT NULL,
  supplier_id     uuid REFERENCES suppliers(id),
  storage_country char(2) REFERENCES countries(code),
  access_country  char(2) REFERENCES countries(code),
  data_subjects   text NOT NULL CHECK (data_subjects IN ('EU', 'MA', 'MIXED'))
);

CREATE TABLE assessments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  context_snapshot jsonb NOT NULL,
  score           int CHECK (score BETWEEN 0 AND 100),
  completed_at    timestamptz,
  created_by      uuid REFERENCES users(id)
);

CREATE TABLE answers (
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_id   text NOT NULL REFERENCES questions(id),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  answer        text NOT NULL CHECK (answer IN ('yes', 'partial', 'no')),
  PRIMARY KEY (assessment_id, question_id)
);

CREATE TABLE applicability_results (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assessment_id   uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  requirement_id  text NOT NULL REFERENCES legal_requirements(id),
  status          text NOT NULL CHECK (status IN ('applicable', 'review', 'not_applicable')),
  reason          text NOT NULL,
  confidence      text NOT NULL,
  PRIMARY KEY (assessment_id, requirement_id)
);

CREATE TABLE documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  file_name       text NOT NULL,
  mime_type       text NOT NULL CHECK (mime_type IN ('application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/png', 'image/jpeg')),
  size_bytes      int NOT NULL CHECK (size_bytes BETWEEN 1 AND 20971520),
  sha256          char(64) NOT NULL,
  storage_key     text NOT NULL,                -- object storage key, encrypted at rest
  scan_status     text NOT NULL DEFAULT 'pending' CHECK (scan_status IN ('pending', 'clean', 'infected', 'failed')),
  uploaded_by     uuid REFERENCES users(id),
  uploaded_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, sha256)
);

CREATE TABLE ai_analyses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_id     uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  engine          text NOT NULL,                -- 'rules-v1', 'llm:<provider>:<model>'
  verdict         text NOT NULL CHECK (verdict IN ('supported', 'partial', 'not_demonstrated', 'irrelevant')),
  findings        jsonb NOT NULL,
  injection_flags jsonb NOT NULL DEFAULT '[]',
  validated_by    uuid REFERENCES users(id),
  validated_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE evidence (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  control_id      text NOT NULL REFERENCES controls(id),
  document_id     uuid REFERENCES documents(id) ON DELETE SET NULL,
  analysis_id     uuid REFERENCES ai_analyses(id) ON DELETE SET NULL,
  status          text NOT NULL CHECK (status IN ('supported', 'partial', 'not_demonstrated', 'irrelevant')),
  note            text,
  owner_user_id   uuid REFERENCES users(id),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON evidence (organization_id, control_id);

CREATE TABLE risks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code            text NOT NULL,
  title           text NOT NULL,
  scenario        text NOT NULL,
  likelihood      int NOT NULL CHECK (likelihood BETWEEN 1 AND 5),
  impact          int NOT NULL CHECK (impact BETWEEN 1 AND 5),
  owner_user_id   uuid REFERENCES users(id),
  UNIQUE (organization_id, code)
);

CREATE TABLE risk_controls (
  risk_id    uuid NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
  control_id text NOT NULL REFERENCES controls(id),
  weight     numeric(3,1) NOT NULL DEFAULT 1 CHECK (weight > 0),
  PRIMARY KEY (risk_id, control_id)
);

CREATE TABLE risk_treatments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  risk_id         uuid NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
  option          text NOT NULL CHECK (option IN ('Reduce', 'Transfer', 'Accept', 'Avoid')),
  justification   text,
  approved_by     uuid REFERENCES users(id),
  approved_at     timestamptz
);

CREATE TABLE recommendations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title           text NOT NULL,
  detail          text NOT NULL,
  control_ids     text[] NOT NULL,
  effort          text NOT NULL CHECK (effort IN ('S', 'M', 'L')),
  cost            text NOT NULL CHECK (cost IN ('Low', 'Medium', 'High')),
  priority_score  numeric(6,1),
  generated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE remediation_tasks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  recommendation_id uuid REFERENCES recommendations(id) ON DELETE SET NULL,
  assignee_user_id uuid REFERENCES users(id),
  due_date        date NOT NULL,
  status          text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done', 'cancelled')),
  completed_evidence_id uuid REFERENCES evidence(id)
);
CREATE INDEX ON remediation_tasks (organization_id, status, due_date);

CREATE TABLE passports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reference       text NOT NULL UNIQUE,         -- 'ACP-XXXX-XXXX'
  snapshot        jsonb NOT NULL,
  snapshot_sha256 char(64) NOT NULL,
  signature       text,                         -- server signature for public verification
  issued_at       timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL,
  shared_token_hash char(64)                    -- hashed share-link token, revocable
);

CREATE TABLE audit_logs (
  id              bigserial PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_user_id   uuid REFERENCES users(id),
  action          text NOT NULL,
  entity          text NOT NULL,
  entity_id       text,
  details         jsonb NOT NULL DEFAULT '{}',
  prev_hash       char(64),                      -- hash chain for tamper evidence
  hash            char(64) NOT NULL,
  at              timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON audit_logs (organization_id, at DESC);

-- ============ Row-level security: tenant isolation ============
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','assets','suppliers','customers','processing_activities','data_flows','assessments','answers',
    'applicability_results','documents','ai_analyses','evidence','risks','risk_treatments','recommendations','remediation_tasks','passports','audit_logs']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY tenant_isolation ON %I USING (organization_id = current_setting(''app.current_org'')::uuid) WITH CHECK (organization_id = current_setting(''app.current_org'')::uuid)', t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (organization_id)', t || '_org_idx', t);
  END LOOP;
END $$;
-- risk_controls inherits isolation through risks (join only via tenant-filtered risks).
-- Audit logs are append-only for the application role:
-- REVOKE UPDATE, DELETE ON audit_logs FROM app_role;
-- Tenant isolation test (CI): set app.current_org to tenant A, insert into B's org -> must fail; select B's rows -> 0 rows.

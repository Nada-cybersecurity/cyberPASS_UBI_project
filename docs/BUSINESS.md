# Business model, competition and validation

> No market-size figures are claimed. Statements about competitors describe their public positioning as generally known and must be re-checked on their websites before being quoted in the pitch.

## Customers
1. **Primary (pays first): Moroccan B2B tech and service exporters with EU customers.** SaaS companies, software development and IT outsourcing firms, BPOs, digital agencies. 10 to 250 staff, no full-time security or compliance person. Trigger: an EU customer's security questionnaire or DPA.
2. **Secondary: European buyers of African services.** Procurement, security and DPO teams that need a consistent way to assess African suppliers.
3. **Channel: consultants and auditors in Morocco** who can deliver more clients per month using the platform.

## Pricing (hypotheses to test, not validated)
| Plan | For | Includes | Pricing logic |
|---|---|---|---|
| Free | Any company | Context, applicability overview, maturity score | Lead generation; shows value before payment |
| SME | Small exporter | Evidence analysis, risk register, fix-first plan, 1 passport | Monthly subscription, priced well below one consulting day per month |
| Professional | Growing exporter | Unlimited passports, share links, NIST/ISO views, multiple users and roles | Per organisation, annual discount |
| Enterprise | EU buyer | Supplier portfolio, evidence requests at scale, integrations (questionnaires, procurement tools), multi-entity | Per supplier assessed or per seat |
| Expert services | Either side | Partner lawyers and consultants for "Requires review" items, ISO 27001 preparation | Marketplace commission |

**Value proposition.** For the supplier: win and keep EU contracts faster, spend budget on the gaps that matter, answer questionnaires once. For the buyer: a consistent, evidence-based view of African suppliers and a precise request instead of a 300-line spreadsheet.

## Acquisition
- Partnerships with Moroccan tech and outsourcing associations, startup programmes and incubators.
- Consultant channel: licence the platform to GRC consultants.
- Two-sided loop: every EU buyer that sends a CyberPass evidence request pulls its suppliers onto the platform; every supplier passport shared exposes buyers to the product.
- Content in French, Arabic and English on "selling to Europe": CNDP, GDPR transfers, NIS2 supply chain.

## Competitive landscape
| Category | Examples (verify current offers) | What they do well | Gap we target |
|---|---|---|---|
| Compliance automation | Vanta, Drata, Secureframe, Sprinto | Automated evidence collection for SOC 2 / ISO 27001 | Priced and designed for funded tech companies; no Moroccan law or Africa-EU transfer context |
| Privacy management | OneTrust and similar | Deep privacy programmes, records of processing | Enterprise complexity; no SME cybersecurity readiness |
| Security ratings | SecurityScorecard, BitSight | Outside-in scans of attack surface | No organisational context or evidence; cannot see policies or processes |
| Questionnaire and trust-centre tools | Whistic and similar | Sharing security documentation with buyers | Assume the supplier already has mature documentation |
| Local consultants | Moroccan GRC and legal firms | Expertise, trust, legal sign-off | Slow and costly for SMEs; we are a channel for them, not a replacement |
| African GRC platforms | Not yet mapped | | Research task: map before claiming differentiation in Africa |

**Our differentiation (precise claim):** the combination of Africa-EU context, explicit regulatory applicability, evidence analysis that separates policy from implementation, cybersecurity assessment and a buyer-facing passport, in one workflow simple enough for an SME without a security team. We do not claim that nobody does any of these parts.

## Entrepreneurial validation
| Question | Answer |
|---|---|
| Strongest customer segment | Moroccan SaaS and IT outsourcing firms with 10 to 100 staff, currently answering EU security questionnaires |
| Weakest assumption | That SMEs will pay before a customer forces them to. Test: 15 interviews, then a paid pilot tied to a live EU deal |
| Biggest technical risk | Evidence analysis quality on messy real documents (scans, French and Arabic text, spreadsheets). Mitigation: human validation, OCR and multilingual patterns, LLM behind the same interface |
| Biggest regulatory risk | Being read as legal advice. Mitigation: readiness wording, review flags, lawyer partners, dated sources, Moroccan law reform watch (Law 09-08 revision discussions) |
| Biggest competitive threat | A global compliance-automation player adding Morocco and transfer templates. Defence: local legal depth, consultant channel, buyer network, French/Arabic UX |
| MVP feature with most value | Evidence check plus fix-first plan: it turns anxiety into a short to-do list |
| Feature to cut first if time is short | Supplier mode UI (keep the concept on a slide) |

## Next 90 days
1. 15 discovery interviews (10 Moroccan suppliers, 5 EU buyers or DPOs).
2. Legal review of every Moroccan record with a Moroccan data protection lawyer; fill verified article numbers.
3. Pilot with 3 companies on real documents; measure time saved per questionnaire.
4. Build the FastAPI/PostgreSQL backend with RLS, accounts and shareable signed passports.

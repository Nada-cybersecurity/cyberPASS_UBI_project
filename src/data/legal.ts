import type { LegalRequirement, OrgContext } from '../engine/types';

// Legal knowledge base, Morocco <-> EU.
// Rules:
//  - Summaries are our own plain-language wording, never quoted legal text.
//  - `reference` holds an article only where we are confident of it; Moroccan article numbers stay null
//    until checked against the official Bulletin Officiel text.
//  - source.status: 'verified' = source document checked on checkedOn;
//    'secondary' = checked through reputable secondary sources, re-verify before reliance;
//    'unverified_demo' = placeholder, not to be relied on.
//  - Every result is a readiness indication, not legal advice.

const CHECKED = '2026-10-06';

const hostingLabel = (c: OrgContext) =>
  c.hosting === 'eu' ? 'the EU' : c.hosting === 'morocco' ? 'Morocco' : 'the United States';

const processesPersonalData = (c: OrgContext) =>
  c.moroccanPersonalData || c.euDataProcessed || c.dataTypes.customerPersonal || c.dataTypes.employee;

const CNDP_SOURCE = {
  name: 'CNDP press release (19 Jan 2026) citing Law 09-08, BO n° 5714',
  url: 'https://www.cndp.ma/wp-content/uploads/2026/01/CNDP-Signature-DATA-TIKA-CNPD-Cap-Vert-FR-20260119.pdf',
};
const LAW_0520_SOURCE = {
  name: 'Law 05-20 on cybersecurity, official text (adala.justice.gov.ma)',
  url: 'https://adala.justice.gov.ma/api/uploads/2024/03/20/La%20cybers%C3%A9curit%C3%A9-1710937403606.pdf',
};
const GDPR_URL = 'https://eur-lex.europa.eu/eli/reg/2016/679/oj';
const ADEQUACY_URL =
  'https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en';

export const LEGAL_REQUIREMENTS: LegalRequirement[] = [
  // ---------------- Morocco ----------------
  {
    id: 'MA-0908-SCOPE',
    jurisdiction: 'MA',
    instrument: 'Law 09-08 (personal data protection)',
    reference: 'Dahir 1-09-15, BO n° 5714 (05/03/2009)',
    title: 'Moroccan personal data protection framework',
    summary:
      'Sets the rules for processing personal data by organisations in Morocco: lawful purpose, information of the people concerned, their rights, and supervision by the CNDP.',
    kind: 'territorial',
    condition: 'Established in Morocco AND processes personal data',
    controls: ['A.5.34', 'A.5.31'],
    source: { ...CNDP_SOURCE, status: 'verified', checkedOn: CHECKED, note: 'Law confirmed in force and cited by the CNDP in 2026. Article numbers not yet mapped.' },
    professionalReview: false,
    evaluate: (c) =>
      processesPersonalData(c)
        ? { status: 'applicable', confidence: 'high', reason: `${c.name} is established in Morocco and processes personal data (customer and employee data).` }
        : { status: 'not_applicable', confidence: 'medium', reason: 'No processing of personal data was declared.' },
  },
  {
    id: 'MA-0908-CNDP',
    jurisdiction: 'MA',
    instrument: 'Law 09-08 (personal data protection)',
    reference: null,
    title: 'Prior formalities with the CNDP',
    summary:
      'Processing activities generally require a prior declaration to, or an authorisation from, the CNDP before they start, depending on the type of data and purpose.',
    kind: 'obligation',
    condition: 'Processes personal data in Morocco',
    controls: ['A.5.34', 'A.5.31'],
    source: { name: 'CNDP (official site)', url: 'https://www.cndp.ma', status: 'secondary', checkedOn: CHECKED, note: 'Formalities and exemptions to confirm per processing activity.' },
    professionalReview: true,
    evaluate: (c) =>
      processesPersonalData(c)
        ? { status: 'applicable', confidence: 'medium', reason: 'Each processing activity (customer platform, HR, billing) may need its own CNDP declaration or authorisation.' }
        : { status: 'not_applicable', confidence: 'medium', reason: 'No processing of personal data was declared.' },
  },
  {
    id: 'MA-0908-SECURITY',
    jurisdiction: 'MA',
    instrument: 'Law 09-08 (personal data protection)',
    reference: null,
    title: 'Security of processing',
    summary:
      'The organisation responsible for processing must put in place appropriate technical and organisational measures to protect personal data against loss, alteration and unauthorised access.',
    kind: 'obligation',
    condition: 'Processes personal data in Morocco',
    controls: ['A.5.15', 'A.8.5', 'A.8.13', 'A.8.15', 'A.5.34'],
    source: { ...CNDP_SOURCE, status: 'secondary', checkedOn: CHECKED, note: 'Article reference to confirm in the official text.' },
    professionalReview: false,
    evaluate: (c) =>
      processesPersonalData(c)
        ? { status: 'applicable', confidence: 'high', reason: 'Customer personal data is stored in your platform and accessed by staff and contractors.' }
        : { status: 'not_applicable', confidence: 'medium', reason: 'No processing of personal data was declared.' },
  },
  {
    id: 'MA-0520-OPERATOR',
    jurisdiction: 'MA',
    instrument: 'Law 05-20 (cybersecurity)',
    reference: 'Dahir 1-20-69 (25 July 2020); Decree 2-21-406',
    title: 'National cybersecurity obligations',
    summary:
      'Security rules for public entities, vital-importance infrastructure, and designated private operators such as telecom operators, internet access providers, cybersecurity providers, digital service providers and internet platforms. Supervised by the DGSSI.',
    kind: 'cybersecurity',
    condition: 'Public entity, OR vital-importance infrastructure, OR designated operator (e.g. digital service provider)',
    controls: ['A.5.24', 'A.5.26', 'A.5.30', 'A.8.15'],
    source: { ...LAW_0520_SOURCE, status: 'verified', checkedOn: CHECKED, note: 'Scope categories read in the official text. Designation criteria for operators to confirm.' },
    professionalReview: true,
    evaluate: (c) => {
      if (c.publicEntity || c.vitalInfrastructure)
        return { status: 'applicable', confidence: 'high', reason: 'You declared being a public entity or vital-importance infrastructure.' };
      if (['saas', 'it_services', 'ecommerce', 'fintech'].includes(c.sector))
        return {
          status: 'review',
          confidence: 'low',
          reason: 'Law 05-20 also covers designated private operators, including digital service providers. A SaaS company may fall in that category: check the definition and any designation.',
        };
      return { status: 'not_applicable', confidence: 'medium', reason: 'Your answers do not match the entity, infrastructure or operator categories.' };
    },
  },
  {
    id: 'MA-DNSSI',
    jurisdiction: 'MA',
    instrument: 'National Directive on Information Systems Security (DNSSI)',
    reference: null,
    title: 'DGSSI security directive',
    summary:
      'Organisational and technical security measures that public entities and vital-importance infrastructure must implement. A useful reference baseline for other organisations.',
    kind: 'cybersecurity',
    condition: 'Public entity OR vital-importance infrastructure',
    controls: ['A.5.1', 'A.8.8', 'A.8.15'],
    source: { name: 'DGSSI (official site)', url: 'https://www.dgssi.gov.ma', status: 'secondary', checkedOn: CHECKED, note: 'Scope confirmed through press coverage of the updated directive.' },
    professionalReview: false,
    evaluate: (c) =>
      c.publicEntity || c.vitalInfrastructure
        ? { status: 'applicable', confidence: 'high', reason: 'You declared being a public entity or vital-importance infrastructure.' }
        : { status: 'not_applicable', confidence: 'medium', reason: 'Targets public entities and vital infrastructure. Useful as a voluntary baseline only.' },
  },

  // ---------------- European Union ----------------
  {
    id: 'EU-GDPR-ART3',
    jurisdiction: 'EU',
    instrument: 'GDPR (Regulation (EU) 2016/679)',
    reference: 'Art. 3(2)',
    title: 'Direct application of GDPR to a non-EU company',
    summary:
      'GDPR applies directly to a company outside the EU when it offers goods or services to people in the EU, or monitors their behaviour there.',
    kind: 'territorial',
    condition: 'Offers services directly to individuals in the EU OR monitors their behaviour',
    controls: ['A.5.34', 'A.5.31'],
    source: { name: 'EUR-Lex, GDPR; EDPB Guidelines 3/2018 on territorial scope', url: GDPR_URL, status: 'secondary', checkedOn: CHECKED },
    professionalReview: true,
    evaluate: (c) => {
      if (c.euIndividualsTargeted)
        return { status: 'applicable', confidence: 'high', reason: 'You offer services directly to people in the EU.' };
      if (c.euBusinessCustomers && c.euDataProcessed)
        return {
          status: 'review',
          confidence: 'low',
          reason: 'You sell to EU companies, not individuals. GDPR mainly reaches you through your customers\' contracts. Confirm that no activity of yours (website users, marketing) targets people in the EU.',
        };
      return { status: 'not_applicable', confidence: 'medium', reason: 'No EU individuals targeted and no EU personal data processed.' };
    },
  },
  {
    id: 'EU-GDPR-ART27',
    jurisdiction: 'EU',
    instrument: 'GDPR (Regulation (EU) 2016/679)',
    reference: 'Art. 27',
    title: 'EU representative',
    summary: 'A non-EU company directly subject to GDPR under Art. 3(2) generally has to designate a representative in the EU, with limited exceptions.',
    kind: 'obligation',
    condition: 'GDPR applies directly under Art. 3(2)',
    controls: ['A.5.31'],
    source: { name: 'EUR-Lex, GDPR', url: GDPR_URL, status: 'secondary', checkedOn: CHECKED },
    professionalReview: true,
    evaluate: (c) =>
      c.euIndividualsTargeted
        ? { status: 'applicable', confidence: 'medium', reason: 'GDPR appears to apply directly, which generally triggers the representative duty.' }
        : { status: 'not_applicable', confidence: 'medium', reason: 'Only needed when GDPR applies directly under Art. 3(2).' },
  },
  {
    id: 'EU-GDPR-ART28',
    jurisdiction: 'EU',
    instrument: 'GDPR (Regulation (EU) 2016/679)',
    reference: 'Art. 28',
    title: 'Processor obligations through customer contracts',
    summary:
      'EU customers that use a service provider to process personal data must sign a data processing agreement imposing security, confidentiality, sub-processor and assistance obligations.',
    kind: 'contractual',
    condition: 'Sells to EU companies AND processes personal data on their behalf',
    controls: ['A.5.34', 'A.5.20', 'A.5.15', 'A.5.24'],
    source: { name: 'EUR-Lex, GDPR', url: GDPR_URL, status: 'secondary', checkedOn: CHECKED },
    professionalReview: false,
    evaluate: (c) =>
      c.euBusinessCustomers && c.euDataProcessed
        ? { status: 'applicable', confidence: 'high', reason: 'Your French and German customers are controllers. They must bind you with a data processing agreement.' }
        : { status: 'not_applicable', confidence: 'medium', reason: 'You do not process personal data for EU business customers.' },
  },
  {
    id: 'EU-NIS2-DIRECT',
    jurisdiction: 'EU',
    instrument: 'NIS2 Directive (EU) 2022/2555',
    reference: 'Art. 2 and Art. 26',
    title: 'Direct NIS2 obligations',
    summary:
      'Applies mainly to medium and large entities in listed sectors. Certain non-EU digital providers offering services in the EU must designate an EU representative.',
    kind: 'cybersecurity',
    condition: 'Medium or large entity in a listed sector providing services in the EU',
    controls: ['A.5.24', 'A.5.26', 'A.5.30', 'A.5.19'],
    source: { name: 'EUR-Lex, NIS2 Directive', url: 'https://eur-lex.europa.eu/eli/dir/2022/2555/oj', status: 'secondary', checkedOn: CHECKED, note: 'Size test also depends on turnover and balance sheet.' },
    professionalReview: true,
    evaluate: (c) =>
      c.employees >= 50 && c.sellsTo.eu && ['saas', 'it_services'].includes(c.sector)
        ? { status: 'review', confidence: 'low', reason: 'You may be a medium-sized digital provider serving the EU. Check the sector annexes and the representative rule.' }
        : { status: 'not_applicable', confidence: 'medium', reason: `Below the medium-enterprise threshold on headcount (${c.employees} employees). Turnover and sector exceptions should still be confirmed.` },
  },
  {
    id: 'EU-NIS2-SUPPLY',
    jurisdiction: 'EU',
    instrument: 'NIS2 Directive (EU) 2022/2555',
    reference: 'Art. 21(2)(d)',
    title: 'Supply-chain security requirements from EU customers',
    summary:
      'EU entities in scope of NIS2 must manage security risks in their supply chain. Their suppliers receive security clauses, questionnaires and audit requests.',
    kind: 'contractual',
    condition: 'Sells to EU companies',
    controls: ['A.5.19', 'A.5.20', 'A.8.5', 'A.5.24'],
    source: { name: 'EUR-Lex, NIS2 Directive', url: 'https://eur-lex.europa.eu/eli/dir/2022/2555/oj', status: 'secondary', checkedOn: CHECKED },
    professionalReview: false,
    evaluate: (c) =>
      c.euBusinessCustomers
        ? { status: 'review', confidence: 'medium', reason: 'If any EU customer is a NIS2 entity, expect contractual security requirements to flow down to you.' }
        : { status: 'not_applicable', confidence: 'medium', reason: 'No EU business customers declared.' },
  },
  {
    id: 'EU-DORA-ICT',
    jurisdiction: 'EU',
    instrument: 'DORA (Regulation (EU) 2022/2554)',
    reference: 'Arts. 28-30',
    title: 'ICT third-party requirements from EU financial customers',
    summary:
      'EU financial entities must manage ICT third-party risk and include specific terms in contracts with ICT service providers, including security, audit and exit provisions.',
    kind: 'contractual',
    condition: 'At least one customer is an EU financial entity',
    controls: ['A.5.19', 'A.5.20', 'A.5.30', 'A.5.24'],
    source: { name: 'EUR-Lex, DORA', url: 'https://eur-lex.europa.eu/eli/reg/2022/2554/oj', status: 'secondary', checkedOn: CHECKED },
    professionalReview: true,
    evaluate: (c) =>
      c.euFinancialCustomers
        ? { status: 'applicable', confidence: 'high', reason: 'An EU financial customer must apply DORA third-party rules to you through the contract.' }
        : { status: 'not_applicable', confidence: 'high', reason: 'No EU financial-entity customers declared.' },
  },

  // ---------------- Cross-border ----------------
  {
    id: 'EU-GDPR-TRANSFER',
    jurisdiction: 'CROSS',
    instrument: 'GDPR (Regulation (EU) 2016/679), Chapter V',
    reference: 'Arts. 44-46; SCCs: Decision (EU) 2021/914',
    title: 'International transfer of EU personal data',
    summary:
      'Personal data leaving the EU needs an adequacy decision or an appropriate safeguard such as Standard Contractual Clauses, usually with a transfer impact assessment.',
    kind: 'transfer',
    condition: 'EU personal data stored in OR accessed from a country without an EU adequacy decision',
    controls: ['A.5.14', 'A.5.34', 'A.5.20'],
    source: {
      name: 'European Commission, adequacy decisions; EUR-Lex SCC decision',
      url: ADEQUACY_URL,
      status: 'secondary',
      checkedOn: CHECKED,
      note: 'Morocco absent from current adequacy lists (checked via secondary sources). Re-check the official page before reliance.',
    },
    professionalReview: true,
    evaluate: (c) => {
      if (!c.euDataProcessed) return { status: 'not_applicable', confidence: 'medium', reason: 'No EU personal data processed.' };
      if (c.hosting === 'morocco')
        return { status: 'applicable', confidence: 'high', reason: 'EU personal data is stored in Morocco, which has no EU adequacy decision. A safeguard such as SCCs is needed.' };
      if (c.hosting === 'us')
        return { status: 'review', confidence: 'medium', reason: 'EU personal data is stored in the US. Check whether the recipient is certified under the EU-US Data Privacy Framework.' };
      if (c.remoteAccessFromMorocco)
        return {
          status: 'applicable',
          confidence: 'medium',
          reason: 'Data is hosted in the EU, but staff in Morocco can access it. Remote access from a third country is treated as a transfer, and Morocco has no adequacy decision.',
        };
      return { status: 'not_applicable', confidence: 'medium', reason: 'EU data stays in the EU and is not accessed from outside it.' };
    },
  },
  {
    id: 'MA-0908-TRANSFER',
    jurisdiction: 'CROSS',
    instrument: 'Law 09-08 (personal data protection)',
    reference: null,
    title: 'Transfer of Moroccan personal data abroad',
    summary:
      'Transfers of personal data from Morocco to another country are restricted depending on the protection level of the destination and may require CNDP formalities.',
    kind: 'transfer',
    condition: 'Moroccan personal data stored outside Morocco',
    controls: ['A.5.14', 'A.5.34'],
    source: { ...CNDP_SOURCE, status: 'secondary', checkedOn: CHECKED, note: 'Transfer articles and CNDP list of destination countries to confirm.' },
    professionalReview: true,
    evaluate: (c) =>
      c.moroccanPersonalData && c.hosting !== 'morocco'
        ? { status: 'review', confidence: 'medium', reason: `Moroccan customer and employee data is stored in ${hostingLabel(c)}. Check the CNDP formalities for this destination.` }
        : { status: 'not_applicable', confidence: 'medium', reason: 'Moroccan personal data stays in Morocco based on your answers.' },
  },
];

export const LEGAL_DISCLAIMER =
  'This platform provides cybersecurity and compliance readiness assessments based on the information and evidence provided. It does not constitute legal advice, certification, or a guarantee of regulatory compliance. Regulatory applicability should be validated by qualified legal/compliance professionals where required.';

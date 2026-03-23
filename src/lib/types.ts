export type JournalEntry = {
  entity: "Journal Entry";
  companyCode?: string;
  fiscalYear: number;
  accountingDocument: string;
  glAccount: string;
  referenceDocument: string;
  costCenterProfitCenter?: string;
  transactionCurrency: string;
  amountInTransactionCurrency: number;
  companyCodeCurrency: string;
  amountInCompanyCodeCurrency: number;
  postingDocumentDate: string;
  accountingDocumentType: string;
  accountingDocumentItem: number;
  connectionCount: number;
};

export type GraphNode = {
  id: string;
  group: 0 | 1;
  label: string;
  /** When true, hidden when “granular overlay” is off */
  granular?: boolean;
  journalEntry?: JournalEntry;
};

export type GraphLink = {
  source: string;
  target: string;
};

export type GraphPayload = {
  nodes: GraphNode[];
  links: GraphLink[];
};

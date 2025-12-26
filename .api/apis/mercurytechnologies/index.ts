import type * as types from './types';
import type { ConfigOptions, FetchResponse } from 'api/dist/core'
import Oas from 'oas';
import APICore from 'api/dist/core';
import definition from './openapi.json';

class SDK {
  spec: Oas;
  core: APICore;

  constructor() {
    this.spec = Oas.init(definition);
    this.core = new APICore(this.spec, 'mercurytechnologies/1.0.0 (api/6.1.3)');
  }

  /**
   * Optionally configure various options that the SDK allows.
   *
   * @param config Object of supported SDK options and toggles.
   * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
   * should be represented in milliseconds.
   */
  config(config: ConfigOptions) {
    this.core.setConfig(config);
  }

  /**
   * If the API you're using requires authentication you can supply the required credentials
   * through this method and the library will magically determine how they should be used
   * within your API request.
   *
   * With the exception of OpenID and MutualTLS, it supports all forms of authentication
   * supported by the OpenAPI specification.
   *
   * @example <caption>HTTP Basic auth</caption>
   * sdk.auth('username', 'password');
   *
   * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
   * sdk.auth('myBearerToken');
   *
   * @example <caption>API Keys</caption>
   * sdk.auth('myApiKey');
   *
   * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
   * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
   * @param values Your auth credentials for the API; can specify up to two strings or numbers.
   */
  auth(...values: string[] | number[]) {
    this.core.setAuth(...values);
    return this;
  }

  /**
   * If the API you're using offers alternate server URLs, and server variables, you can tell
   * the SDK which one to use with this method. To use it you can supply either one of the
   * server URLs that are contained within the OpenAPI definition (along with any server
   * variables), or you can pass it a fully qualified URL to use (that may or may not exist
   * within the OpenAPI definition).
   *
   * @example <caption>Server URL with server variables</caption>
   * sdk.server('https://{region}.api.example.com/{basePath}', {
   *   name: 'eu',
   *   basePath: 'v14',
   * });
   *
   * @example <caption>Fully qualified server URL</caption>
   * sdk.server('https://eu.api.example.com/v14');
   *
   * @param url Server URL
   * @param variables An object of variables to replace into the server URL.
   */
  server(url: string, variables = {}) {
    this.core.setServer(url, variables);
  }

  /**
   * Get account by id
   *
   */
  getAccount(metadata: types.GetAccountMetadataParam): Promise<FetchResponse<200, types.GetAccountResponse200>> {
    return this.core.fetch('/account/{accountId}', 'get', metadata);
  }

  /**
   * Retrieve all debit and credit cards associated with a specific account.
   *
   * @summary Get cards for account
   */
  getAccountCards(metadata: types.GetAccountCardsMetadataParam): Promise<FetchResponse<200, types.GetAccountCardsResponse200>> {
    return this.core.fetch('/account/{accountId}/cards', 'get', metadata);
  }

  /**
   * Create a payment request that may require approval based on your organization's payment
   * policies.
   *
   * @summary Request to send money
   */
  requestSendMoney(body: types.RequestSendMoneyBodyParam, metadata: types.RequestSendMoneyMetadataParam): Promise<FetchResponse<200, types.RequestSendMoneyResponse200>> {
    return this.core.fetch('/account/{accountId}/request-send-money', 'post', body, metadata);
  }

  /**
   * Retrieve monthly statements for a specific account. Supports date range filtering.
   *
   * @summary Get account statements
   */
  getAccountStatements(metadata: types.GetAccountStatementsMetadataParam): Promise<FetchResponse<200, types.GetAccountStatementsResponse200>> {
    return this.core.fetch('/account/{accountId}/statements', 'get', metadata);
  }

  /**
   * Get transaction by id
   *
   */
  getTransaction(metadata: types.GetTransactionMetadataParam): Promise<FetchResponse<200, types.GetTransactionResponse200>> {
    return this.core.fetch('/account/{accountId}/transaction/{transactionId}', 'get', metadata);
  }

  /**
   * Retrieve a paginated list of transactions for a specific account. Supports filtering by
   * date range, status, and search terms.
   *
   * @summary List account transactions
   */
  listAccountTransactions(metadata: types.ListAccountTransactionsMetadataParam): Promise<FetchResponse<200, types.ListAccountTransactionsResponse200>> {
    return this.core.fetch('/account/{accountId}/transactions', 'get', metadata);
  }

  /**
   * Send money from this account. Creates a transaction that will be processed immediately
   * or may require approval.
   *
   * @summary Create a transaction
   */
  createTransaction(body: types.CreateTransactionBodyParam, metadata: types.CreateTransactionMetadataParam): Promise<FetchResponse<200, types.CreateTransactionResponse200>> {
    return this.core.fetch('/account/{accountId}/transactions', 'post', body, metadata);
  }

  /**
   * Get all accounts
   *
   */
  getAccounts(): Promise<FetchResponse<200, types.GetAccountsResponse200>> {
    return this.core.fetch('/accounts', 'get');
  }

  /**
   * Retrieve attachment details including download URL
   *
   * @summary Get an attachment
   */
  getAttachment(metadata: types.GetAttachmentMetadataParam): Promise<FetchResponse<200, types.GetAttachmentResponse200>> {
    return this.core.fetch('/ar/attachments/{attachmentId}', 'get', metadata);
  }

  /**
   * Retrieve a list of all customers for the organization
   *
   * @summary List all customers
   */
  listCustomers(): Promise<FetchResponse<200, types.ListCustomersResponse200>> {
    return this.core.fetch('/ar/customers', 'get');
  }

  /**
   * Create a new customer for the organization
   *
   * @summary Create a customer
   */
  createCustomer(body: types.CreateCustomerBodyParam): Promise<FetchResponse<200, types.CreateCustomerResponse200>> {
    return this.core.fetch('/ar/customers', 'post', body);
  }

  /**
   * Delete a customer. This action cannot be undone.
   *
   * @summary Delete a customer
   */
  deleteCustomer(metadata: types.DeleteCustomerMetadataParam): Promise<FetchResponse<200, types.DeleteCustomerResponse200>> {
    return this.core.fetch('/ar/customers/{customerId}', 'delete', metadata);
  }

  /**
   * Retrieve details of a specific customer by their ID
   *
   * @summary Get a customer
   */
  getCustomer(metadata: types.GetCustomerMetadataParam): Promise<FetchResponse<200, types.GetCustomerResponse200>> {
    return this.core.fetch('/ar/customers/{customerId}', 'get', metadata);
  }

  /**
   * Update an existing customer
   *
   * @summary Update a customer
   */
  updateCustomer(body: types.UpdateCustomerBodyParam, metadata: types.UpdateCustomerMetadataParam): Promise<FetchResponse<200, types.UpdateCustomerResponse200>> {
    return this.core.fetch('/ar/customers/{customerId}', 'post', body, metadata);
  }

  /**
   * Retrieve a list of all invoices for the organization
   *
   * @summary List all invoices
   */
  listInvoices(): Promise<FetchResponse<200, types.ListInvoicesResponse200>> {
    return this.core.fetch('/ar/invoices', 'get');
  }

  /**
   * Create a new invoice for the organization
   *
   * @summary Create an invoice
   */
  createInvoice(body: types.CreateInvoiceBodyParam): Promise<FetchResponse<200, types.CreateInvoiceResponse200>> {
    return this.core.fetch('/ar/invoices', 'post', body);
  }

  /**
   * Retrieve details of an invoice by its ID
   *
   * @summary Get an invoice
   */
  getInvoice(metadata: types.GetInvoiceMetadataParam): Promise<FetchResponse<200, types.GetInvoiceResponse200>> {
    return this.core.fetch('/ar/invoices/{invoiceId}', 'get', metadata);
  }

  /**
   * Update an existing invoice
   *
   * @summary Update an invoice
   */
  updateInvoice(body: types.UpdateInvoiceBodyParam, metadata: types.UpdateInvoiceMetadataParam): Promise<FetchResponse<200, types.UpdateInvoiceResponse200>> {
    return this.core.fetch('/ar/invoices/{invoiceId}', 'post', body, metadata);
  }

  /**
   * Retrieve a list of all attachments for a specific invoice
   *
   * @summary List invoice attachments
   */
  listInvoiceAttachments(metadata: types.ListInvoiceAttachmentsMetadataParam): Promise<FetchResponse<200, types.ListInvoiceAttachmentsResponse200>> {
    return this.core.fetch('/ar/invoices/{invoiceId}/attachments', 'get', metadata);
  }

  /**
   * Cancel an invoice. This action cannot be undone.
   *
   * @summary Cancel an invoice
   */
  cancelInvoice(metadata: types.CancelInvoiceMetadataParam): Promise<FetchResponse<200, types.CancelInvoiceResponse200>> {
    return this.core.fetch('/ar/invoices/{invoiceId}/cancel', 'post', metadata);
  }

  /**
   * Downloads a PDF file for the specified invoice. The response includes a
   * Content-Disposition header set to 'attachment' with the filename.
   *
   * @summary Download invoice PDF
   */
  getInvoicePdf(metadata: types.GetInvoicePdfMetadataParam): Promise<FetchResponse<200, types.GetInvoicePdfResponse200>> {
    return this.core.fetch('/ar/invoices/{invoiceId}/pdf', 'get', metadata);
  }

  /**
   * Retrieve a list of all available custom expense categories for the organization.
   *
   * @summary List all categories
   */
  listCategories(): Promise<FetchResponse<200, types.ListCategoriesResponse200>> {
    return this.core.fetch('/categories', 'get');
  }

  /**
   * Retrieve a list of all credit accounts for the organization.
   *
   * @summary List all credit accounts
   */
  listCredit(): Promise<FetchResponse<200, types.ListCreditResponse200>> {
    return this.core.fetch('/credit', 'get');
  }

  /**
   * Get all events
   *
   */
  getEvents(metadata?: types.GetEventsMetadataParam): Promise<FetchResponse<200, types.GetEventsResponse200>> {
    return this.core.fetch('/events', 'get', metadata);
  }

  /**
   * Get event by id
   *
   */
  getEvent(metadata: types.GetEventMetadataParam): Promise<FetchResponse<200, types.GetEventResponse200>> {
    return this.core.fetch('/events/{eventId}', 'get', metadata);
  }

  /**
   * Retrieve information about your organization including EIN, legal business name, and
   * DBAs.
   *
   * @summary Get organization information
   */
  getOrganization(): Promise<FetchResponse<200, types.GetOrganizationResponse200>> {
    return this.core.fetch('/organization', 'get');
  }

  /**
   * Retrieve details of a specific recipient by ID
   *
   * @summary Get recipient by id
   */
  getRecipient(metadata: types.GetRecipientMetadataParam): Promise<FetchResponse<200, types.GetRecipientResponse200>> {
    return this.core.fetch('/recipient/{recipientId}', 'get', metadata);
  }

  /**
   * Update an existing recipient's information
   *
   * @summary Edit information about a specific recipient
   */
  updateRecipient(body: types.UpdateRecipientBodyParam, metadata: types.UpdateRecipientMetadataParam): Promise<FetchResponse<200, types.UpdateRecipientResponse200>>;
  updateRecipient(metadata: types.UpdateRecipientMetadataParam): Promise<FetchResponse<200, types.UpdateRecipientResponse200>>;
  updateRecipient(body?: types.UpdateRecipientBodyParam | types.UpdateRecipientMetadataParam, metadata?: types.UpdateRecipientMetadataParam): Promise<FetchResponse<200, types.UpdateRecipientResponse200>> {
    return this.core.fetch('/recipient/{recipientId}', 'post', body, metadata);
  }

  /**
   * Retrieve a paginated list of all recipients. Use cursor parameters (start_after,
   * end_before) for pagination.
   *
   * @summary Get all recipients
   */
  getRecipients(metadata?: types.GetRecipientsMetadataParam): Promise<FetchResponse<200, types.GetRecipientsResponse200>> {
    return this.core.fetch('/recipients', 'get', metadata);
  }

  /**
   * Create a new recipient for making payments
   *
   * @summary Add a new recipient
   */
  createRecipient(body: types.CreateRecipientBodyParam): Promise<FetchResponse<200, types.CreateRecipientResponse200>> {
    return this.core.fetch('/recipients', 'post', body);
  }

  /**
   * Get send money approval request by id
   *
   */
  getSendMoneyApprovalRequest(metadata: types.GetSendMoneyApprovalRequestMetadataParam): Promise<FetchResponse<200, types.GetSendMoneyApprovalRequestResponse200>> {
    return this.core.fetch('/request-send-money/{requestId}', 'get', metadata);
  }

  /**
   * Downloads a PDF file for the specified account statement. The response includes a
   * Content-Disposition header for proper file download handling. Returns binary PDF data.
   *
   * @summary Download account statement PDF
   */
  getStatementPdf(metadata: types.GetStatementPdfMetadataParam): Promise<FetchResponse<200, types.GetStatementPdfResponse200>> {
    return this.core.fetch('/statements/{statementId}/pdf', 'get', metadata);
  }

  /**
   * Retrieve a single transaction by its ID. Returns full transaction details including
   * attachments, check images, and related metadata.
   *
   * @summary Get a transaction by ID
   */
  getTransactionById(metadata: types.GetTransactionByIdMetadataParam): Promise<FetchResponse<200, types.GetTransactionByIdResponse200>> {
    return this.core.fetch('/transaction/{transactionId}', 'get', metadata);
  }

  /**
   * Update the note and/or category of an existing transaction. Use null values to clear
   * existing data.
   *
   * @summary Update transaction metadata
   */
  updateTransaction(body: types.UpdateTransactionBodyParam, metadata: types.UpdateTransactionMetadataParam): Promise<FetchResponse<200, types.UpdateTransactionResponse200>> {
    return this.core.fetch('/transaction/{transactionId}', 'patch', body, metadata);
  }

  /**
   * Retrieve a paginated list of all transactions across all accounts. Supports advanced
   * filtering by date ranges, status, categories, and cursor-based pagination.
   *
   * @summary List all transactions
   */
  listTransactions(metadata?: types.ListTransactionsMetadataParam): Promise<FetchResponse<200, types.ListTransactionsResponse200>> {
    return this.core.fetch('/transactions', 'get', metadata);
  }

  /**
   * Transfer funds between two accounts within the same organization. Creates paired debit
   * and credit transactions.
   *
   * @summary Create an internal transfer
   */
  createInternalTransfer(body: types.CreateInternalTransferBodyParam): Promise<FetchResponse<200, types.CreateInternalTransferResponse200>> {
    return this.core.fetch('/transfer', 'post', body);
  }

  /**
   * Retrieve all treasury accounts associated with the authenticated organization.
   *
   * @summary Get all treasury accounts
   */
  getTreasury(): Promise<FetchResponse<200, types.GetTreasuryResponse200>> {
    return this.core.fetch('/treasury', 'get');
  }

  /**
   * Retrieve paginated treasury transactions for a specific treasury account.
   *
   * @summary Get treasury transactions
   */
  getTreasuryTransactions(metadata: types.GetTreasuryTransactionsMetadataParam): Promise<FetchResponse<200, types.GetTreasuryTransactionsResponse200>> {
    return this.core.fetch('/treasury/{treasuryId}/transactions', 'get', metadata);
  }

  /**
   * Get all users
   *
   */
  getUsers(metadata?: types.GetUsersMetadataParam): Promise<FetchResponse<200, types.GetUsersResponse200>> {
    return this.core.fetch('/users', 'get', metadata);
  }

  /**
   * Get user by id
   *
   */
  getUser(metadata: types.GetUserMetadataParam): Promise<FetchResponse<200, types.GetUserResponse200>> {
    return this.core.fetch('/users/{userId}', 'get', metadata);
  }

  /**
   * Retrieve a paginated list of all webhook endpoints for your organization. Supports
   * filtering by status.
   *
   * @summary Get webhook endpoints
   */
  getWebhooks(metadata?: types.GetWebhooksMetadataParam): Promise<FetchResponse<200, types.GetWebhooksResponse200>> {
    return this.core.fetch('/webhooks', 'get', metadata);
  }

  /**
   * Register a new webhook endpoint to receive event notifications
   *
   * @summary Create a new webhook endpoint
   */
  createWebhook(body: types.CreateWebhookBodyParam): Promise<FetchResponse<200, types.CreateWebhookResponse200>> {
    return this.core.fetch('/webhooks', 'post', body);
  }

  /**
   * Delete a webhook endpoint
   *
   * @summary Delete a webhook endpoint
   */
  deleteWebhook(metadata: types.DeleteWebhookMetadataParam): Promise<FetchResponse<200, types.DeleteWebhookResponse200>> {
    return this.core.fetch('/webhooks/{webhookEndpointId}', 'delete', metadata);
  }

  /**
   * Retrieve details of a specific webhook endpoint by ID
   *
   * @summary Get webhook endpoint by id
   */
  getWebhook(metadata: types.GetWebhookMetadataParam): Promise<FetchResponse<200, types.GetWebhookResponse200>> {
    return this.core.fetch('/webhooks/{webhookEndpointId}', 'get', metadata);
  }

  /**
   * Update the configuration of an existing webhook endpoint
   *
   * @summary Update an existing webhook endpoint
   */
  updateWebhook(body: types.UpdateWebhookBodyParam, metadata: types.UpdateWebhookMetadataParam): Promise<FetchResponse<200, types.UpdateWebhookResponse200>>;
  updateWebhook(metadata: types.UpdateWebhookMetadataParam): Promise<FetchResponse<200, types.UpdateWebhookResponse200>>;
  updateWebhook(body?: types.UpdateWebhookBodyParam | types.UpdateWebhookMetadataParam, metadata?: types.UpdateWebhookMetadataParam): Promise<FetchResponse<200, types.UpdateWebhookResponse200>> {
    return this.core.fetch('/webhooks/{webhookEndpointId}', 'post', body, metadata);
  }

  /**
   * Send a test event to verify the webhook endpoint is properly configured and reachable.
   * The request body accepts an optional 'eventType' field to specify which event type to
   * test (e.g., 'transaction.created', 'transaction.updated'). If omitted from the request
   * body, defaults to 'transaction.created'.
   *
   * @summary Verify a webhook endpoint
   */
  verifyWebhook(body: types.VerifyWebhookBodyParam, metadata: types.VerifyWebhookMetadataParam): Promise<FetchResponse<200, types.VerifyWebhookResponse200>>;
  verifyWebhook(metadata: types.VerifyWebhookMetadataParam): Promise<FetchResponse<200, types.VerifyWebhookResponse200>>;
  verifyWebhook(body?: types.VerifyWebhookBodyParam | types.VerifyWebhookMetadataParam, metadata?: types.VerifyWebhookMetadataParam): Promise<FetchResponse<200, types.VerifyWebhookResponse200>> {
    return this.core.fetch('/webhooks/{webhookEndpointId}/verify', 'post', body, metadata);
  }
}

const createSDK = (() => { return new SDK(); })()
;

export default createSDK;

export type { CancelInvoiceMetadataParam, CancelInvoiceResponse200, CreateCustomerBodyParam, CreateCustomerResponse200, CreateInternalTransferBodyParam, CreateInternalTransferResponse200, CreateInvoiceBodyParam, CreateInvoiceResponse200, CreateRecipientBodyParam, CreateRecipientResponse200, CreateTransactionBodyParam, CreateTransactionMetadataParam, CreateTransactionResponse200, CreateWebhookBodyParam, CreateWebhookResponse200, DeleteCustomerMetadataParam, DeleteCustomerResponse200, DeleteWebhookMetadataParam, DeleteWebhookResponse200, GetAccountCardsMetadataParam, GetAccountCardsResponse200, GetAccountMetadataParam, GetAccountResponse200, GetAccountStatementsMetadataParam, GetAccountStatementsResponse200, GetAccountsResponse200, GetAttachmentMetadataParam, GetAttachmentResponse200, GetCustomerMetadataParam, GetCustomerResponse200, GetEventMetadataParam, GetEventResponse200, GetEventsMetadataParam, GetEventsResponse200, GetInvoiceMetadataParam, GetInvoicePdfMetadataParam, GetInvoicePdfResponse200, GetInvoiceResponse200, GetOrganizationResponse200, GetRecipientMetadataParam, GetRecipientResponse200, GetRecipientsMetadataParam, GetRecipientsResponse200, GetSendMoneyApprovalRequestMetadataParam, GetSendMoneyApprovalRequestResponse200, GetStatementPdfMetadataParam, GetStatementPdfResponse200, GetTransactionByIdMetadataParam, GetTransactionByIdResponse200, GetTransactionMetadataParam, GetTransactionResponse200, GetTreasuryResponse200, GetTreasuryTransactionsMetadataParam, GetTreasuryTransactionsResponse200, GetUserMetadataParam, GetUserResponse200, GetUsersMetadataParam, GetUsersResponse200, GetWebhookMetadataParam, GetWebhookResponse200, GetWebhooksMetadataParam, GetWebhooksResponse200, ListAccountTransactionsMetadataParam, ListAccountTransactionsResponse200, ListCategoriesResponse200, ListCreditResponse200, ListCustomersResponse200, ListInvoiceAttachmentsMetadataParam, ListInvoiceAttachmentsResponse200, ListInvoicesResponse200, ListTransactionsMetadataParam, ListTransactionsResponse200, RequestSendMoneyBodyParam, RequestSendMoneyMetadataParam, RequestSendMoneyResponse200, UpdateCustomerBodyParam, UpdateCustomerMetadataParam, UpdateCustomerResponse200, UpdateInvoiceBodyParam, UpdateInvoiceMetadataParam, UpdateInvoiceResponse200, UpdateRecipientBodyParam, UpdateRecipientMetadataParam, UpdateRecipientResponse200, UpdateTransactionBodyParam, UpdateTransactionMetadataParam, UpdateTransactionResponse200, UpdateWebhookBodyParam, UpdateWebhookMetadataParam, UpdateWebhookResponse200, VerifyWebhookBodyParam, VerifyWebhookMetadataParam, VerifyWebhookResponse200 } from './types';

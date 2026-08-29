export type Account = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

/**
 * Provider-neutral authentication contract.
 * The production adapter should implement these operations server-side.
 */
export type AuthSession = {
  accountId: string;
  email: string;
  expiresAt: string;
};

export type AuthProvider = {
  createAccount(email: string, name: string): Promise<Account>;
  getSession(request: Request): Promise<AuthSession | null>;
  signOut(request: Request): Promise<void>;
};

export interface StoredUser {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface SessionUser {
  email: string;
  firstName: string;
  lastName: string;
}

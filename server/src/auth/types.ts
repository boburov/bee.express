export type ActorType = 'user' | 'super_admin';

export interface UserJwtPayload {
  sub: string; // userId
  type: 'user';
  roleSlug: string | null;
  iat?: number;
  exp?: number;
}

export interface SuperAdminJwtPayload {
  sub: string; // superAdminId
  type: 'super_admin';
  iat?: number;
  exp?: number;
}

export type JwtPayload = UserJwtPayload | SuperAdminJwtPayload;

export interface AuthenticatedUser {
  id: string;
  type: 'user';
  roleSlug: string | null;
}

export interface AuthenticatedSuperAdmin {
  id: string;
  type: 'super_admin';
}

export type Authenticated = AuthenticatedUser | AuthenticatedSuperAdmin;

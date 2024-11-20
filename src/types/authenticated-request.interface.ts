import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    keycloak_id: string;
    // Add other properties as needed
  };
}

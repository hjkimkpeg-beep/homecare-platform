declare module "express-session" {
  interface SessionData {
    userId: string;
    userRole: string;
    customerProfileId?: string;
    partnerProfileId?: string;
  }
}

export {};

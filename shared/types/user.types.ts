export type Gender = "male" | "female" | "other";

export type UserRole = "passenger" | "driver" | "both";

export interface User {
  id: string;
  supabaseAuthId: string;
  phone: string;
  name: string | null;
  photoUrl: string | null;
  gender: Gender | null;
  role: UserRole;
  trustScore: number;
  aadhaarVerified: boolean;
  dlVerified: boolean;
  faceMatchDone: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface DriverProfile {
  id: string;
  userId: string;
  dlNumber: string | null;
  dlExpiry: string | null;
  hypervergeDlTxnId: string | null;
  hypervergeAadhaarTxnId: string | null;
  yearsOfExperience: number;
  totalTrips: number;
  cancellationCount: number;
  reliabilityScore: number;
  bankAccountLast4: string | null;
  ifsc: string | null;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  driverId: string;
  make: string;
  model: string;
  color: string | null;
  registrationNumber: string;
  year: number | null;
  isVerified: boolean;
  createdAt: string;
}

export interface EmergencyContact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  relationship: string;
  createdAt: string;
}

export interface KycSession {
  id: string;
  userId: string;
  documentType: "aadhaar" | "dl" | "selfie";
  hypervergeTxnId: string;
  status: "pending" | "verified" | "failed";
  storagePath: string | null;
  createdAt: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: User;
}

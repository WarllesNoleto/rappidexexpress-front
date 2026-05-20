export interface User {
  id: string;
  isActive: boolean;
  ifoodMerchantId?: string;
  ifoodClientId?: string;
  location: string;
  name: string;
  permission: string;
  phone: string;
  profileImage: string;
  type: string;
  user: string;
  useIfoodIntegration?: boolean;
  ifoodOrdersReleased?: number;
  ifoodOrdersUsed?: number;
  ifoodOrdersAvailable?: number;
}
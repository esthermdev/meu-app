import { RestaurantRow } from './database';

export type { FaqRow, RestaurantRow, VendorRow } from './database';

export interface RestaurantSection {
  title: string;
  data: RestaurantRow[];
}

export interface Coach {
  name: string;
  organization: string;
  avatar?: string;
  description: string;
}

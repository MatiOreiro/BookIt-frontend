export interface RegisterServiceRequest {
  name: string;
  description: string;
  price: number;
  category: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  ownerId: string;
}

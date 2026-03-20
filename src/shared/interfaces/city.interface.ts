export interface City {
  id?: string
  name: string
  // createdAt is optional as API may or may not return it
  createdAt?: string
  state?: string
}

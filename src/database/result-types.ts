export interface Created<T> {
  status: 'created';
  data: T;
}
export interface Updated<T> {
  status: 'updated';
  data: T;
}
export interface Found<T> {
  status: 'found';
  data: T;
}
export interface NotFound {
  status: 'not_found';
}
export interface Duplicate<C extends string> {
  status: 'duplicate';
  constraint: C;
}
export interface ReferenceNotFound<F extends string> {
  status: 'reference_not_found';
  field: F;
}
export interface StatusConflict<S extends string> {
  status: 'status_conflict';
  currentStatus: S;
}

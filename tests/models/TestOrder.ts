export interface TestOrderRow {
  order_uid: string;
  order_reference: number;
  supplier_id: string;
  patient_uid: string;
  test_code: string;
  originator: string | null;
  created_at: Date;
  supplier_name: string;
  nhs_number: string;
  birth_date: Date;
}

export type UUID = string;
export interface Supplier {
  supplier_id: UUID;
  supplier_name: 'Preventx' | 'SH:24';
}

export interface PatientMapping {
  patient_uid: UUID;
  nhs_number: string;
  birth_date: string; // ISO date (YYYY-MM-DD)
}

export interface TestOrder {
  order_uid: UUID;
  supplier_id: UUID;
  patient_uid: UUID;
  test_code: string; // e.g., 'PCR'
  originator: string; // e.g., 'automatic-test'
}


export type OrderStatusCode = 'ORDER_RECEIVED' | 'DISPATCHED' | 'RECEIVED' | 'COMPLETE';

export interface CreateOrderInput {
  nhs_number: string;
  birth_date: string; // 'YYYY-MM-DD'
  supplier_name: Supplier['supplier_name'];
  test_code: string;
  originator?: string;
  initial_status: OrderStatusCode;
}

export interface CreateOrderResult {
  patient_uid: UUID;
  supplier_id: UUID;
  order_uid: UUID;
  status_code: OrderStatusCode;
}


export class TestOrderModel {
  order_uid!: string;
  order_reference!: number;
  supplier_id!: string;
  patient_uid!: string;
  test_code!: string;
  originator!: string | null;
  created_at!: Date;
  supplier_name!: string;
  nhs_number!: string;
  birth_date!: Date;

  constructor(row: TestOrderRow) {
    Object.assign(this, row);
  }

  static fromRow(row: TestOrderRow): TestOrderModel {
    return new TestOrderModel(row);
  }

  isValidOrder(): boolean {
    return (
      !!this.order_uid &&
      !!this.order_reference &&
      !!this.supplier_id &&
      !!this.patient_uid &&
      !!this.test_code &&
      this.created_at instanceof Date
    );
  }
}

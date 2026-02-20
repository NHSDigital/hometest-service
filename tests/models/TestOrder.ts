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

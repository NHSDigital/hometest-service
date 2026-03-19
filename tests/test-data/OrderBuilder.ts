import type { CreateOrderInput, OrderStatusCode, Supplier } from "../models/TestOrder";
import type { BaseTestUser } from "../utils/users";

export class OrderBuilder {
  private builder: Partial<CreateOrderInput> = {
    nhs_number: "9999999999",
    birth_date: "1980-01-01",
    supplier_name: "Preventx",
    test_code: "31676001",
    initial_status: "CONFIRMED",
  };

  withUser(user: BaseTestUser): this {
    if (user.nhsNumber) {
      this.builder.nhs_number = user.nhsNumber;
    }
    if (user.dob) {
      this.builder.birth_date = user.dob;
    }
    return this;
  }

  withNhsNumber(nhsNumber: string): this {
    this.builder.nhs_number = nhsNumber;
    return this;
  }

  withBirthDate(birthDate: string): this {
    this.builder.birth_date = birthDate;
    return this;
  }

  withSupplier(supplierName: Supplier["supplier_name"]): this {
    this.builder.supplier_name = supplierName;
    return this;
  }

  withTestCode(testCode: string): this {
    this.builder.test_code = testCode;
    return this;
  }

  withStatus(status: OrderStatusCode): this {
    this.builder.initial_status = status;
    return this;
  }

  withOriginator(originator: string): this {
    this.builder.originator = originator;
    return this;
  }

  build(): CreateOrderInput {
    const nhs_number = this.builder.nhs_number;
    const birth_date = this.builder.birth_date;
    const supplier_name = this.builder.supplier_name;
    const test_code = this.builder.test_code;
    const initial_status = this.builder.initial_status;

    if (!nhs_number || !birth_date || !supplier_name || !test_code || !initial_status) {
      throw new Error("OrderBuilder: missing required fields");
    }

    return {
      nhs_number,
      birth_date,
      supplier_name,
      test_code,
      initial_status,
      originator: this.builder.originator,
    };
  }
}

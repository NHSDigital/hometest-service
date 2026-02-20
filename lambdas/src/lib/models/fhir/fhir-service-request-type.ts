export interface FHIRCoding {
  system?: string;
  code?: string;
  display?: string;
}

export interface FHIRCodeableConcept {
  coding?: FHIRCoding[];
  text?: string;
}

export interface FHIRReference {
  reference: string;
  type?: string;
  display?: string;
}

export interface FHIRHumanName {
  use?: string;
  family: string;
  given?: string[];
  text?: string;
}

export interface FHIRContactPoint {
  system?: "phone" | "fax" | "email" | "pager" | "url" | "sms" | "other";
  value: string;
  use?: "home" | "work" | "temp" | "old" | "mobile";
}

export interface FHIRAddress {
  use?: "home" | "work" | "temp" | "old" | "billing";
  type?: "postal" | "physical" | "both";
  line: string[];
  city?: string;
  postalCode: string;
  country?: string;
}

export interface FHIRContainedPatient {
  resourceType: "Patient";
  id: string;
  name: FHIRHumanName[];
  telecom: FHIRContactPoint[];
  address: FHIRAddress[];
  birthDate?: string;
}

export interface FHIRServiceRequest {
  resourceType: "ServiceRequest";
  id?: string;
  status:
    | "draft"
    | "active"
    | "on-hold"
    | "revoked"
    | "completed"
    | "entered-in-error"
    | "unknown";
  intent:
    | "proposal"
    | "plan"
    | "directive"
    | "order"
    | "original-order"
    | "reflex-order"
    | "filler-order"
    | "instance-order"
    | "option";
  code: FHIRCodeableConcept;
  contained: FHIRContainedPatient[];
  subject: FHIRReference;
  requester: FHIRReference;
  performer?: FHIRReference[];
}

export interface FHIRIdentifier {
  system?: string;
  value: string;
  use?: "usual" | "official" | "temp" | "secondary" | "old";
}

export type FHIRTaskStatus =
  | "draft"
  | "requested"
  | "received"
  | "accepted"
  | "rejected"
  | "ready"
  | "cancelled"
  | "in-progress"
  | "on-hold"
  | "failed"
  | "completed"
  | "entered-in-error";

export type FHIRTaskIntent =
  | "proposal"
  | "plan"
  | "order"
  | "original-order"
  | "reflex-order"
  | "filler-order"
  | "instance-order"
  | "option";

export interface FHIRTaskPerformer {
  actor: FHIRReference;
}

export interface FHIRTask {
  resourceType: "Task";
  id?: string;

  identifier?: FHIRIdentifier[];
  basedOn: FHIRReference[];
  status: FHIRTaskStatus;
  intent: FHIRTaskIntent;

  statusReason?: FHIRCodeableConcept;
  businessStatus?: FHIRCodeableConcept;

  for: FHIRReference;
  authoredOn?: string; // ISO datetime string
  lastModified?: string; // ISO datetime string

  requester?: FHIRReference;
  owner?: FHIRReference;
}

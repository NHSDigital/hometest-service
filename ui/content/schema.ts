/**
 * TypeScript schema definitions for the JSON CMS content system.
 * All content loaded from content.json must conform to these types.
 */

// ============================================================================
// Common Content Types
// ============================================================================

export interface NavigationContent {
  back: string;
  continue: string;
}

export interface ValidationMessages {
  postcode: {
    required: string;
    maxLength: string;
    invalid: string;
  };
  buildingName: {
    maxLength: string;
  };
  addressLine1: {
    required: string;
    maxLength: string;
    invalid: string;
  };
  addressLine2: {
    maxLength: string;
    invalid: string;
  };
  addressLine3: {
    maxLength: string;
    invalid: string;
  };
  townOrCity: {
    required: string;
    maxLength: string;
    invalid: string;
  };
}

export interface CommonLinks {
  sexualHealthClinic: {
    text: string;
    href: string;
  };
  nearestAE: {
    text: string;
    href: string;
  };
}

export interface ErrorSummaryContent {
  title: string;
}

export interface CommonContent {
  navigation: NavigationContent;
  validation: ValidationMessages;
  links: CommonLinks;
  errorSummary: ErrorSummaryContent;
}

// ============================================================================
// Page Content Types
// ============================================================================

export interface StartPageContent {
  title: string;
  ageRequirement: string;
  availabilityNotice: string;
  urgentCard: {
    heading: string;
    exposureWarning: string;
    clinicAdvice: string;
    aeAdvice: string;
  };
  infoBox: {
    text: string;
  };
  howItWorks: {
    heading: string;
    deliveryInfo: string;
    stepByStepLink: string;
    sampleInstructions: string;
  };
  dataSharing: {
    summary: string;
    details: string;
  };
  startButton: string;
  aboutService: {
    heading: string;
    text: string;
    termsLink: string;
    privacyLink: string;
  };
  otherOptions: {
    heading: string;
    clinicText: string;
    clinicLinkText: string;
    clinicTextEnd: string;
    sexualHealthText: string;
    sexualHealthLink: {
      text: string;
      href: string;
    };
    learnMoreLink: {
      text: string;
      href: string;
    };
  };
}

export interface EnterDeliveryAddressContent {
  title: string;
  form: {
    postcodeLabel: string;
    postcodeHint: string;
    buildingNameLabel: string;
    buildingNameHint: string;
  };
  manualEntryLink: string;
}

export interface EnterAddressManuallyContent {
  title: string;
  form: {
    addressLine1Label: string;
    addressLine2Label: string;
    addressLine3Label: string;
    townOrCityLabel: string;
    postcodeLabel: string;
    postcodeHint: string;
  };
}

export interface NoAddressFoundContent {
  title: string;
  notFoundMessage: string;
  tryNewSearchLink: string;
  enterManuallyLink: string;
}

// ============================================================================
// Pages Container
// ============================================================================

export interface PagesContent {
  "get-self-test-kit-for-HIV": StartPageContent;
  "enter-delivery-address": EnterDeliveryAddressContent;
  "enter-address-manually": EnterAddressManuallyContent;
  "no-address-found": NoAddressFoundContent;
}

// ============================================================================
// Root Content File Type
// ============================================================================

export interface ContentFile {
  commonContent: CommonContent;
  pages: PagesContent;
}

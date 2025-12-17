export function PhoneAnchor({
  phoneNumber,
  phoneNumberForScreenReaders,
  displayText
}: {
  phoneNumber: string;
  phoneNumberForScreenReaders: string;
  displayText: string;
}) {
  return (
    <>
      <a
        href={'tel:' + phoneNumber}
        aria-label={'Call ' + phoneNumberForScreenReaders}
      >
        {displayText}
      </a>
    </>
  );
}

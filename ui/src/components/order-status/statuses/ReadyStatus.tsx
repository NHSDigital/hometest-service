import { MoreInformationLinks } from "./MoreInformationLinks";

export function ReadyStatus() {
  return (
    <>
      <h2 className="nhsuk-heading-m">Your result is ready</h2>
      <p>
        <a
          href="#"
          className="nhsuk-link"
          aria-label="View your HIV test result"
        >
          View your result
        </a>
      </p>
      <hr />
      <MoreInformationLinks />
    </>
  );
}

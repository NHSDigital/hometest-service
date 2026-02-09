import { Link } from "react-router-dom";

interface AboutServiceProps {
  supplier: string;
}

export function AboutService({ supplier }: AboutServiceProps) {
  return (
    <div className="nhsuk-u-margin-top-7">
      <h2 className="nhsuk-heading-m">About this service</h2>
      <p className="nhsuk-body">
        {`HomeTest `}
        <Link
          to="/home-test-terms-of-use"
          className="nhsuk-link"
          aria-label="HomeTest terms of use"
        >
          terms of use
        </Link>
        {" and "}
        <Link
          to="/home-test-privacy-policy"
          className="nhsuk-link"
          aria-label="HomeTest privacy policy"
        >
          privacy policy
        </Link>
        .
      </p>
      <p className="nhsuk-body">
        {`${supplier} `}
        <Link
          to="/suppliers-terms-conditions"
          className="nhsuk-link"
          aria-label={`${supplier} terms of use`}
        >
          terms of use
        </Link>
        {" and "}
        <Link
          to="/suppliers-privacy-policy"
          className="nhsuk-link"
          aria-label={`${supplier} privacy policy`}
        >
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}

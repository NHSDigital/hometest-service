import { ActionLink } from "nhsuk-react-components";

import { useCommonContent } from "@/hooks";

interface FindAnotherSexualHealthClinicLinkProps {
  postcodeSearch?: string;
}

export function FindAnotherSexualHealthClinicLink({
  postcodeSearch,
}: Readonly<FindAnotherSexualHealthClinicLinkProps>) {
  const commonContent = useCommonContent();
  const linkContent = commonContent.links.findAnotherSexualHealthClinic;
  let href = linkContent.href;

  if (postcodeSearch) {
    href += `/results?location=${encodeURIComponent(postcodeSearch)}`;
  }

  return (
    <ActionLink href={href} target="_blank" rel="noreferrer noopener">
      {linkContent.text}
    </ActionLink>
  );
}

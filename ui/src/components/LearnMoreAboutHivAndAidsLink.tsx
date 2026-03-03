import { OpensInNewTabLink } from "@/components/OpensInNewTabLink";
import { useCommonContent } from "@/hooks";

export function LearnMoreAboutHivAndAidsLink() {
  const commonContent = useCommonContent();
  const linkContent = commonContent.links.learnMoreAboutHivAndAids;

  return (
    <p className="nhsuk-body">
      <OpensInNewTabLink linkHref={linkContent.href} linkText={linkContent.text} />
    </p>
  );
}

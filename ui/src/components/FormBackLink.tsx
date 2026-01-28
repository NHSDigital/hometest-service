import { BackLink } from "nhsuk-react-components";
import { useNavigationContext } from "../state";

// Custom onClick can be used for confirm-details page (eg. pass goToStep with referenced step)
// Custom Continue button will need to be implemented to allow user to navigate back to confirm-details page

interface FormBackLinkProps {
  text?: string;
  onClick?: () => void;
}

export function FormBackLink({ text = "Back", onClick }: FormBackLinkProps) {
  const { goBack, canGoBack, currentStep, stepHistory } = useNavigationContext();

  // Debug logging
  console.log("[FormBackLink] Current step:", currentStep);
  console.log("[FormBackLink] Step history:", stepHistory);
  console.log("[FormBackLink] Can go back:", canGoBack());

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      goBack();
    }
  };

  // Always render if custom onClick is provided
  // For regular back navigation, show if there's somewhere to go back to
  if (!onClick && !canGoBack()) {
    console.log("[FormBackLink] Not rendering - cannot go back and no custom onClick");
    return null;
  }

  return (
    <BackLink onClick={handleClick}>
      {text}
    </BackLink>
  );
}
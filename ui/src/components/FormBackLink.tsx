import { BackLink } from "nhsuk-react-components";
import { useJourneyNavigationContext } from "../state";

interface FormBackLinkProps {
  text?: string;
  onClick?: () => void;
}

export function FormBackLink({ text = "Back", onClick }: FormBackLinkProps) {
  const { goBack, canGoBack, currentStep, stepHistory } = useJourneyNavigationContext();

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
    return null;
  }

  return (
    <BackLink onClick={handleClick}>
      {text}
    </BackLink>
  );
}

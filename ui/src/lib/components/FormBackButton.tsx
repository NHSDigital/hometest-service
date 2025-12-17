import { BackLink } from 'nhsuk-react-components';
import { Link } from 'react-router-dom';

interface FormBackButtonProps {
  children: React.ReactNode;
  backToUrl?: string;
  displayNhsAppServicesBackButton?: boolean;
}

export default function FormBackButton({ ...props }: FormBackButtonProps) {
  const { children, displayNhsAppServicesBackButton } = props;

  const isUserComingFromNHSApp = window.nhsapp?.tools.isOpenInNHSApp();

  if (isUserComingFromNHSApp && displayNhsAppServicesBackButton) {
    const nhsAppBackLink = <BackLink asElement={Link}>{children}</BackLink>;
    nhsAppBackLink.props.onClick = () => {
      window.nhsapp.navigation.goToPage(
        window.nhsapp.navigation.AppPage.SERVICES
      );
    };

    return nhsAppBackLink;
  }

  if (props.backToUrl) {
    return (
      <BackLink asElement={Link} to={props.backToUrl}>
        {children}
      </BackLink>
    );
  }

  return <></>;
}

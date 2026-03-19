import "@testing-library/jest-dom";

import { CannotUseServiceUnder18Content, CommonContent } from "@/content";
import CannotUseServiceUnder18Page, {
  HARD_CODED_CLINIC_DATA,
  NHS_LINKS,
} from "@/routes/get-self-test-kit-for-HIV-journey/CannotUseServiceUnder18Page";
import {
  CreateOrderProvider,
  JourneyNavigationContext,
  JourneyNavigationProvider,
  OrderAnswers,
  useCreateOrderContext,
} from "@/state";
import { JourneyStepNames, RoutePath } from "@/lib/models/route-paths";
import React, { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mockedContent: CannotUseServiceUnder18Content = {
  title: "some-mocked-title",
  intro: "some-mocked-intro",
  phoneLabel: "some-mocked-phone-label",
  directionsLinkText: "some-mocked-directions-link-text",
  findAnotherClinicLinkText: "some-mocked-find-another-clinic-link-text",
  moreOptionsHeading: "some-mocked-more-options-heading",
  youngPeopleServicesText: "some-mocked-young-people-services-text",
  youngPeopleServicesLinkText: "some-mocked-young-people-services-link-text",
  learnMoreLinkHref: "some-mocked-learn-more-link-href",
  learnMoreLinkText: "some-mocked-learn-more-link-text",
};

const mockedCommonContent: Partial<CommonContent> = {
  feedback: {
    text: "some-mocked-feedback-text",
    linkHref: "some-mocked-feedback-link-href",
    linkText: "some-mocked-feedback-link-text",
  },
};

jest.mock("@/hooks", () => ({
  useContent: () => ({
    "cannot-use-service-under-18": mockedContent,
  }),
  useCommonContent: () => mockedCommonContent,
}));

const goBackMock = jest.fn();
const goToStepMock = jest.fn();

const TestProvider = ({
  children,
  stepHistory,
  orderAnswers,
}: {
  children: ReactNode;
  stepHistory?: JourneyStepNames[];
  orderAnswers?: OrderAnswers;
}) => {
  const history = stepHistory ?? [
    JourneyStepNames.EnterAddressManually,
    JourneyStepNames.CannotUseServiceUnder18,
  ];
  const answers = orderAnswers ?? {};

  return (
    <MemoryRouter
      initialEntries={[
        `${RoutePath.GetSelfTestKitPage}/${JourneyStepNames.CannotUseServiceUnder18}`,
      ]}
    >
      <JourneyNavigationContext.Provider
        value={{
          currentStep: JourneyStepNames.CannotUseServiceUnder18,
          stepHistory: history,
          returnToStep: null,
          goBack: goBackMock,
          goToStep: goToStepMock,
          canGoBack: () => history.length > 1,
          clearHistory: jest.fn(),
          setReturnToStep: jest.fn(),
        }}
      >
        <CreateOrderProvider>
          <OrderDataSetter orderAnswers={answers}>{children}</OrderDataSetter>
        </CreateOrderProvider>
      </JourneyNavigationContext.Provider>
    </MemoryRouter>
  );
};

const OrderDataSetter = ({
  children,
  orderAnswers,
}: {
  children: ReactNode;
  orderAnswers: OrderAnswers;
}) => {
  const { updateOrderAnswers } = useCreateOrderContext();

  React.useEffect(() => {
    updateOrderAnswers(orderAnswers);
  }, [orderAnswers, updateOrderAnswers]);

  return <>{children}</>;
};

type RenderOptions = {
  stepHistory?: JourneyStepNames[];
  orderAnswers?: OrderAnswers;
};

const renderWithProviders = (
  ui: React.ReactElement,
  { stepHistory, orderAnswers }: RenderOptions = {},
) => {
  return render(ui, {
    wrapper: ({ children }) => (
      <TestProvider stepHistory={stepHistory} orderAnswers={orderAnswers}>
        {children}
      </TestProvider>
    ),
  });
};

describe("CannotUseServiceUnder18Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the main heading and intro content", () => {
    renderWithProviders(<CannotUseServiceUnder18Page />);

    expect(
      screen.getByRole("heading", { name: mockedContent.title, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText(mockedContent.intro)).toBeInTheDocument();
  });

  it("renders clinic details and links", () => {
    renderWithProviders(<CannotUseServiceUnder18Page />);

    expect(screen.getByText(HARD_CODED_CLINIC_DATA.name)).toBeInTheDocument();
    expect(screen.getByText(HARD_CODED_CLINIC_DATA.address)).toBeInTheDocument();

    const clinicLink = screen.getByRole("link", {
      name: new RegExp(`^${HARD_CODED_CLINIC_DATA.name}`),
    });
    expect(clinicLink).toHaveAttribute("href", HARD_CODED_CLINIC_DATA.detailsLink);

    const phoneLink = screen.getByRole("link", { name: HARD_CODED_CLINIC_DATA.phone });
    expect(screen.getByText(mockedContent.phoneLabel)).toBeInTheDocument();

    const expectedPhoneHref = `tel:${HARD_CODED_CLINIC_DATA.phone.replace(/\s+/g, "")}`;
    expect(phoneLink).toHaveAttribute("href", expectedPhoneHref);

    const directionsLink = screen.getByRole("link", {
      name: new RegExp(`^${mockedContent.directionsLinkText}`),
    });
    expect(directionsLink).toHaveAttribute("target", "_blank");
    expect(directionsLink).toHaveAttribute("href", HARD_CODED_CLINIC_DATA.directionsLink);
  });

  it("renders the follow-on support and feedback links when a postcode is set", () => {
    const mockPostcode = "E14 7EG";

    renderWithProviders(<CannotUseServiceUnder18Page />, {
      orderAnswers: { deliveryAddress: { postcode: mockPostcode } },
    });

    expect(
      screen.getByRole("heading", { name: mockedContent.moreOptionsHeading, level: 2 }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: mockedContent.findAnotherClinicLinkText }),
    ).toHaveAttribute(
      "href",
      `${NHS_LINKS.findClinic}/results?location=${encodeURIComponent(mockPostcode)}`,
    );

    expect(
      screen.getByText(mockedContent.youngPeopleServicesText, { exact: false }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: new RegExp(`^${mockedContent.youngPeopleServicesLinkText}`),
      }),
    ).toHaveAttribute(
      "href",
      `${NHS_LINKS.findYoungPeoplesServices}/results?location=${encodeURIComponent(mockPostcode)}`,
    );

    expect(
      screen.getByRole("link", { name: new RegExp(`^${mockedContent.learnMoreLinkText}`) }),
    ).toHaveAttribute("href", mockedContent.learnMoreLinkHref);

    expect(
      screen.getByText(mockedCommonContent.feedback!.text, { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: new RegExp(`^${mockedCommonContent.feedback!.linkText}`) }),
    ).toHaveAttribute("href", mockedCommonContent.feedback!.linkHref);
  });

  it("renders the follow-on support and feedback links when a postcode is NOT set", () => {
    renderWithProviders(<CannotUseServiceUnder18Page />);

    expect(
      screen.getByRole("heading", { name: mockedContent.moreOptionsHeading, level: 2 }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: mockedContent.findAnotherClinicLinkText }),
    ).toHaveAttribute("href", NHS_LINKS.findClinic);

    expect(
      screen.getByText(mockedContent.youngPeopleServicesText, { exact: false }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: new RegExp(`^${mockedContent.youngPeopleServicesLinkText}`),
      }),
    ).toHaveAttribute("href", NHS_LINKS.findYoungPeoplesServices);

    expect(
      screen.getByRole("link", { name: new RegExp(`^${mockedContent.learnMoreLinkText}`) }),
    ).toHaveAttribute("href", mockedContent.learnMoreLinkHref);

    expect(
      screen.getByText(mockedCommonContent.feedback!.text, { exact: false }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: new RegExp(`^${mockedCommonContent.feedback!.linkText}`) }),
    ).toHaveAttribute("href", mockedCommonContent.feedback!.linkHref);
  });
});

describe("Back Navigation", () => {
  it("calls goBack when there is previous step history", () => {
    renderWithProviders(<CannotUseServiceUnder18Page />, {
      stepHistory: [
        JourneyStepNames.EnterAddressManually,
        JourneyStepNames.CannotUseServiceUnder18,
      ],
    });

    fireEvent.click(screen.getByText("Back"));

    expect(goBackMock).toHaveBeenCalledTimes(1);
    expect(goToStepMock).not.toHaveBeenCalled();
  });

  it("calls goToStep when there is no previous step", () => {
    renderWithProviders(<CannotUseServiceUnder18Page />, {
      stepHistory: [JourneyStepNames.CannotUseServiceUnder18],
    });

    fireEvent.click(screen.getByText("Back"));

    expect(goBackMock).not.toHaveBeenCalled();
    expect(goToStepMock).toHaveBeenCalledWith(RoutePath.GetSelfTestKitPage);
  });
});

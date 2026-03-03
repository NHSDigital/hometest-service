import { render, screen } from "@testing-library/react";

import { FeedbackSection } from "@/components/FeedbackSection";

describe("FeedbackSection", () => {
  it("renders feedback text", () => {
    render(<FeedbackSection />);

    expect(screen.getByText(/this is a new service\. help us improve it and/i)).toBeInTheDocument();
  });

  it("renders feedback link with configured text, href and new-tab attributes", () => {
    render(<FeedbackSection />);

    const feedbackLink = screen.getByText(/give your feedback/i);
    expect(feedbackLink).toBeInTheDocument();
    expect(feedbackLink).toHaveAttribute("href", "");
    expect(feedbackLink).toHaveAttribute("target", "_blank");
    expect(feedbackLink).toHaveAttribute("rel", "noreferrer noopener");
  });
});

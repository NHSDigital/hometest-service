import { render, screen } from "@testing-library/react";

import { FeedbackSection } from "@/components/FeedbackSection";

describe("FeedbackSection", () => {
  it("renders feedback text", () => {
    render(<FeedbackSection />);

    expect(screen.getByText(/this is a new service\. help us improve it and/i)).toBeInTheDocument();
  });

  it("renders feedback link with configured text and href", () => {
    render(<FeedbackSection />);

    const feedbackLink = screen.getByText(/give your feedback/i);
    expect(feedbackLink).toBeInTheDocument();
    expect(feedbackLink.tagName).toBe("A");
    expect(feedbackLink).toHaveAttribute("href", "");
  });
});

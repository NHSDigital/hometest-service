"use client";

import { Details, Images } from "nhsuk-react-components";
import { useJourneyNavigationContext } from "@/state";
import { useContent } from "@/hooks";
import PageLayout from "@/layouts/PageLayout";

export default function BloodSampleGuidePage() {
  const { goBack, stepHistory, goToStep } = useJourneyNavigationContext();
  const { "blood-sample-guide": content } = useContent();

  return (
    <PageLayout
      showBackButton
      onBackButtonClick={() => {
        if (stepHistory.length > 1) {
          goBack();
        } else {
          goToStep("get-self-test-kit-for-HIV");
        }
      }}>
        <h1>{content.title}</h1>

        <Details>
        <Details.Summary>{content.whatsInKit.summary}</Details.Summary>
        <Details.Text>
            <p>{content.whatsInKit.intro}</p>
            <ul className="nhsuk-list nhsuk-list--bullet">
            {content.whatsInKit.items.map((item: string, index: number) => (
                <li key={index}>{item}</li>
            ))}
            </ul>
            <Images
            src="/images/self-sample-steps/self-sample-kit-contents.jpg"
            sizes="(max-width: 768px) 100vw, 66vw"
            srcSet="/images/self-sample-steps/self-sample-kit-contents.jpg 600w, /images/self-sample-steps/self-sample-kit-contents.jpg 1000w"
            alt={content.whatsInKit.image.alt}
            caption={content.whatsInKit.image.caption}
            />
        </Details.Text>
        </Details>

        <Details>
        <Details.Summary>{content.tipsBeforeStart.summary}</Details.Summary>
        <Details.Text>
            <p>{content.tipsBeforeStart.intro}</p>
            <ul className="nhsuk-list nhsuk-list--bullet">
            {content.tipsBeforeStart.tips.map((tip: string, index: number) => (
                <li key={index}>{tip}</li>
            ))}
            </ul>
        </Details.Text>
        </Details>

        {content.steps.map((step: { heading: string; image: { src: string; alt: string }; caption: string }, index: number) => (
        <div key={index}>
            <h2 className="nhsuk-heading-m">{step.heading}</h2>
            <Images
            src={step.image.src}
            sizes="(max-width: 768px) 100vw, 66vw"
            srcSet={`${step.image.src} 600w, ${step.image.src} 1000w`}
            alt={step.image.alt}
            caption={step.caption}
            />
        </div>
        ))}
    </PageLayout>
  );
}

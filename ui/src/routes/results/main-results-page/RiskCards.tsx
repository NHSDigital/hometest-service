import { type FC } from 'react';
import { Card } from 'nhsuk-react-components';
import { OpensInNewTabLink } from '../../../lib/components/opens-in-new-tab-link';
import { PhoneAnchor } from '../../../lib/components/phone-anchor';

const DiabetesSymptomsList: FC = () => (
  <ul>
    <li>peeing more than usual</li>
    <li>feeling very thirsty</li>
    <li>feeling very tired</li>
    <li>losing weight without trying</li>
    <li>itching or repeated thrush</li>
    <li>cuts or wounds are taking longer to heal</li>
    <li>blurred vision</li>
  </ul>
);

const ContactGPDiabetes: FC = () => (
  <Card className="result-care-card" cardType="urgent">
    <Card.Heading>Contact your GP surgery urgently if you notice:</Card.Heading>
    <Card.Content>
      <p>any of these signs of diabetes:</p>
      <DiabetesSymptomsList />
    </Card.Content>
  </Card>
);

export const CVDRiskModerateOrHigh: FC = () => (
  <Card className="result-care-card" cardType="non-urgent">
    <Card.Heading>Contact your GP surgery</Card.Heading>
    <Card.Content>
      <p>
        Your CVD risk score is higher than it should be. Your GP surgery can
        help you understand your results and what to do next.
      </p>
    </Card.Content>
  </Card>
);

export const CVDRiskModerateOrHighBMIUnderweightCholesterol: FC = () => (
  <Card className="result-care-card" cardType="non-urgent">
    <Card.Heading>Contact your GP surgery</Card.Heading>
    <Card.Content>
      <p>
        Some of your results are higher than they should be, but there&apos;s
        lots you can do to make a big difference.
      </p>
      <p>
        Read through your results and contact your GP surgery. They&apos;ll give
        you any guidance and support you need.
      </p>
    </Card.Content>
  </Card>
);
export const CVDRiskModerateOrHighDiabetesOrBMICholesterol: FC = () => (
  <>
    <Card className="result-care-card" cardType="non-urgent">
      <Card.Heading>Contact your GP surgery</Card.Heading>
      <Card.Content>
        <p>
          Some of your results are higher than they should be, but there&apos;s
          lots you can do to make a big difference.
        </p>
        <p>
          Read through your results and contact your GP surgery. They&apos;ll
          give you any guidance and support you need.
        </p>
      </Card.Content>
    </Card>

    <ContactGPDiabetes />
  </>
);

export const BMIUnderweightAndCholesterolHighVeryHigh: FC = () => (
  <Card className="result-care-card" cardType="non-urgent">
    <Card.Heading>Contact your GP surgery</Card.Heading>
    <Card.Content>
      <p>
        Talk to your GP surgery about your BMI and cholesterol, if you have not
        already discussed these with them.
      </p>
    </Card.Content>
  </Card>
);

export const CholesterolHigh: FC = () => (
  <Card className="result-care-card" cardType="non-urgent">
    <Card.Heading>Contact your GP surgery if:</Card.Heading>
    <Card.Content>
      <ul>
        <li>
          you are concerned or have questions about your cholesterol level
          results
        </li>
        <li>
          you have a family history of high cholesterol, as it may be due to an
          inherited condition called familial hypercholesterolaemia (FH)
        </li>
      </ul>
    </Card.Content>
  </Card>
);

export const CholesterolVeryHigh: FC = () => (
  <Card className="result-care-card" cardType="non-urgent">
    <Card.Heading>Contact your GP surgery if:</Card.Heading>
    <Card.Content>
      <ul>
        <li>
          you have not already discussed your cholesterol levels with them
        </li>
        <li>
          you have a family history of high cholesterol, as it may be due to an
          inherited condition called familial hypercholesterolaemia (FH)
        </li>
      </ul>
    </Card.Content>
  </Card>
);

export const BMIUnderweight: FC = () => (
  <Card className="result-care-card" cardType="non-urgent">
    <Card.Heading>Contact your GP surgery to:</Card.Heading>
    <Card.Content>
      <ul>
        <li>
          discuss your BMI result, if you&apos;ve not already discussed your
          weight with them.
        </li>
      </ul>
    </Card.Content>
  </Card>
);
export const DiabetesHighRisk: FC = () => (
  <>
    <Card className="result-care-card" cardType="non-urgent">
      <Card.Heading>Contact your GP surgery</Card.Heading>
      <Card.Content>
        <p>
          Discuss your diabetes result with your GP surgery. They&apos;ll give
          you a diagnosis and help you understand what to do next.
        </p>
        <p>They&apos;ll also follow up with you every year.</p>
      </Card.Content>
    </Card>

    <ContactGPDiabetes />
  </>
);

export const DiabetesPossibleDiabetes: FC = () => (
  <>
    <Card className="result-care-card" cardType="urgent">
      <Card.Heading>Contact your GP surgery</Card.Heading>
      <Card.Content>
        <p>
          Your diabetes result is higher than it should be. Contact your GP
          surgery within 24 hours, they&apos;ll help you understand what to do
          next.
        </p>
      </Card.Content>
    </Card>

    <EmergencyCard />
  </>
);

export const DiabetesHighRiskOtherFactorsNoHighBp: FC = () => (
  <>
    <Card className="result-care-card" cardType="urgent">
      <Card.Heading>Contact your GP surgery</Card.Heading>
      <Card.Content>
        <p>
          Your diabetes result is higher than it should be. Contact your GP
          surgery within 24 hours, they&apos;ll help you understand what to do
          next.
        </p>

        <p>
          Check your other results as well. Your GP surgery can explain these in
          more detail and advise you about next steps.
        </p>
      </Card.Content>
    </Card>

    <EmergencyCard />
  </>
);

export const PossibleDiabetesOver86Mol: FC = () => (
  <>
    <Card className="result-care-card" cardType="urgent">
      <Card.Heading>Contact your GP surgery</Card.Heading>
      <Card.Content>
        <p>
          Your diabetes result is higher than it should be. Contact your GP
          surgery within 24 hours, they&apos;ll help you understand what to do
          next.
        </p>

        <p>
          If you cannot speak to your GP surgery today, contact 111 and tell
          them your diabetes score is over 86mmol/mol.
        </p>
      </Card.Content>
    </Card>

    <EmergencyCard />
  </>
);

export const PossibleDiabetesOver86MolAnyFactorNoHighBP: FC = () => (
  <>
    <Card className="result-care-card" cardType="urgent">
      <Card.Heading>Contact your GP surgery</Card.Heading>
      <Card.Content>
        <p>
          Your diabetes result is higher than it should be. Contact your GP
          surgery within 24 hours, they&apos;ll help you understand what to do
          next.
        </p>

        <p>
          If you cannot speak to your GP surgery today, contact 111 and tell
          them your diabetes score is over 86mmol/mol.
        </p>
        <p>
          Check your other results as well. Your GP surgery can explain these in
          more detail and advise you about next steps.
        </p>
      </Card.Content>
    </Card>

    <EmergencyCard />
  </>
);

export const HighBPHome: FC = () => (
  <Card className="result-care-card" cardType="urgent">
    <Card.Heading>Contact your GP surgery or pharmacy</Card.Heading>
    <Card.Content>
      <p>Your blood pressure reading is higher than it should be.</p>

      <p>
        Read your results, and get your blood pressure checked at a GP surgery
        or pharmacy within 2 working days.
      </p>
    </Card.Content>
  </Card>
);

export const HighBPHomeOtherRiskFactorsNotDiabetes: FC = () => (
  <Card className="result-care-card" cardType="urgent">
    <Card.Heading>Contact your GP surgery</Card.Heading>
    <Card.Content>
      <p>
        Your blood pressure reading is higher than it should be. Read your
        results, and get your blood pressure checked at a GP surgery within 2
        working days.
      </p>

      <p>
        Check your other results as well. Your GP surgery can explain these in
        more detail and advise you about next steps.
      </p>
    </Card.Content>
  </Card>
);

export const HighBPDiabetesHighRiskOtherRiskFactorsAllowed: FC = () => (
  <>
    <Card className="result-care-card" cardType="urgent">
      <Card.Heading>Contact your GP surgery</Card.Heading>
      <Card.Content>
        <p>
          Your blood pressure and diabetes results are higher than they should
          be.
        </p>

        <p>
          Contact your GP surgery within 2 working days to get your blood
          pressure checked and discuss your results.
        </p>
        <p>
          Your GP surgery will give you guidance and help you understand what to
          do next.
        </p>
      </Card.Content>
    </Card>

    <ContactGPDiabetes />
  </>
);

export const HighBPHomePossibleDiabetesAnyOtherRiskFactor: FC = () => (
  <>
    <Card className="result-care-card" cardType="urgent">
      <Card.Heading>Contact your GP surgery</Card.Heading>
      <Card.Content>
        <p>
          Your diabetes and blood pressure results are higher than they should
          be.
        </p>

        <p>
          Contact your GP surgery within 24 hours to discuss your diabetes
          result and get your blood pressure checked.
        </p>
        <p>
          Your GP surgery will give you guidance and help you understand what to
          do next.
        </p>
      </Card.Content>
    </Card>

    <EmergencyCard />
  </>
);

export const HighBPPossibleDiabetesOver86AnyRiskFactorAllowed: FC = () => (
  <>
    <Card className="result-care-card" cardType="urgent">
      <Card.Heading>Contact your GP surgery</Card.Heading>
      <Card.Content>
        <p>
          Your diabetes and blood pressure results are higher than they should
          be.
        </p>

        <p>
          Contact your GP surgery within 24 hours to discuss your diabetes
          result and get your blood pressure checked. They will help you
          understand what to do next.
        </p>
        <p>
          If you cannot speak to your GP surgery today, contact 111 and tell
          them your diabetes score is over 86mmol/mol.
        </p>
      </Card.Content>
    </Card>

    <EmergencyCard />
  </>
);

export const FailedCholesterolDiabetes: FC = () => (
  <Card className="result-care-card" cardType="non-urgent">
    <Card.Heading>Contact your GP surgery to:</Card.Heading>
    <Card.Content>
      <ul>
        <li>book another blood test to check your cholesterol levels</li>
        <li>screen for diabetes</li>
        <li>discuss the rest of your results</li>
      </ul>
      <p>
        Your GP surgery can help you understand your results and give you any
        guidance you need.
      </p>
    </Card.Content>
  </Card>
);

export const FailedDiabetes: FC = () => (
  <Card className="result-care-card" cardType="non-urgent">
    <Card.Heading>Contact your GP surgery to:</Card.Heading>
    <Card.Content>
      <ul>
        <li>ask for another blood test to screen for diabetes</li>
      </ul>
      <p>
        After your blood test, a healthcare professional will provide any
        guidance you may need.
      </p>
    </Card.Content>
  </Card>
);

export const FailedCholesterolDiabetesHighBPHome: FC = () => (
  <Card className="result-care-card" cardType="urgent">
    <Card.Heading>Contact your GP surgery</Card.Heading>
    <Card.Content>
      <p>
        Your blood pressure reading is higher than it should be. Read your
        results, and get your blood pressure checked at a GP surgery within 2
        working days.
      </p>
      <p>
        Also ask your GP surgery for another blood test to check your
        cholesterol level and complete your Health Check.
      </p>
    </Card.Content>
  </Card>
);

export const FailedCholesterolDiabetesHighRisk: FC = () => (
  <>
    <Card className="result-care-card" cardType="non-urgent">
      <Card.Heading>Contact your GP surgery to:</Card.Heading>
      <Card.Content>
        <ul>
          <li>book another blood test to check your cholesterol levels</li>
          <li>discuss your diabetes results</li>
        </ul>
        <p>
          Your GP surgery can help you understand your results and give you any
          guidance you need.
        </p>
      </Card.Content>
    </Card>

    <ContactGPDiabetes />
  </>
);

export const FailedCholesterolPossibleDiabetes: FC = () => (
  <>
    <Card className="result-care-card" cardType="urgent">
      <Card.Heading>Contact your GP surgery</Card.Heading>
      <Card.Content>
        <p>
          Your diabetes result is higher than it should be. Contact your GP
          surgery within 24 hours, they&apos;ll help you understand what to do
          next.
        </p>
        <p>
          Also ask your GP surgery for another blood test to check your
          cholesterol level and complete your Health Check.
        </p>
      </Card.Content>
    </Card>

    <EmergencyCard />
  </>
);

export const FailedCholesterolPossibleDiabetesOver86: FC = () => (
  <>
    <Card className="result-care-card" cardType="urgent">
      <Card.Heading>Contact your GP surgery</Card.Heading>
      <Card.Content>
        <p>
          Your diabetes result is higher than it should be. Contact your GP
          surgery within 24 hours, they&apos;ll help you understand what to do
          next.
        </p>
        <p>
          If you cannot speak to your GP surgery today, contact 111 and tell
          them your diabetes score is over 86mmol/mol.
        </p>
        <p>
          Also ask your GP surgery for another blood test to check your
          cholesterol level and complete your Health Check.
        </p>
      </Card.Content>
    </Card>

    <EmergencyCard />
  </>
);

export const FailedCholesterolHighBPHome: FC = () => (
  <Card className="result-care-card" cardType="urgent">
    <Card.Heading>Contact your GP surgery</Card.Heading>
    <Card.Content>
      <p>
        Your blood pressure reading is higher than it should be. Read your
        results, and get your blood pressure checked at a GP surgery within 2
        working days.
      </p>
      <p>
        Also ask your GP surgery for another blood test to check your
        cholesterol level and complete your Health Check.
      </p>
    </Card.Content>
  </Card>
);

export const FailedCholesterolDiabetesHighRiskHighBPHome: FC = () => (
  <>
    <Card className="result-care-card" cardType="urgent">
      <Card.Heading>Contact your GP surgery</Card.Heading>
      <Card.Content>
        <p>
          Your blood pressure and diabetes results are higher than they should
          be.
        </p>
        <p>
          Contact your GP surgery within 2 working days to get your blood
          pressure checked and discuss your results.
        </p>
        <p>
          Your GP surgery will give you guidance and help you understand what to
          do next. They&apos;ll also give you another blood test to check your
          cholesterol level.
        </p>
      </Card.Content>
    </Card>

    <ContactGPDiabetes />
  </>
);

export const FailedCholesterolPossibleDiabetesHighBPHome: FC = () => (
  <>
    <Card className="result-care-card" cardType="urgent">
      <Card.Heading>Contact your GP surgery</Card.Heading>
      <Card.Content>
        <p>
          Your blood pressure and diabetes results are higher than they should
          be.
        </p>
        <p>
          Contact your GP surgery within 2 working days to get your blood
          pressure checked and discuss your results.
        </p>
        <p>
          Your GP surgery will give you guidance and help you understand what to
          do next. They&apos;ll also give you another blood test to check your
          cholesterol level.
        </p>
      </Card.Content>
    </Card>

    <EmergencyCard />
  </>
);
export const FailedCholesterolPossibleDiabetesOver86HighBPHome: FC = () => (
  <>
    <Card className="result-care-card" cardType="urgent">
      <Card.Heading>Contact your GP surgery</Card.Heading>
      <Card.Content>
        <p>
          Your diabetes and blood pressure results are higher than they should
          be.
        </p>
        <p>
          Contact your GP surgery within 24 hours to discuss your diabetes
          result and get your blood pressure checked.
        </p>
        <p>
          If you cannot speak to your GP surgery today, contact 111 and tell
          them your diabetes score is over 86mmol/mol.
        </p>
        <p>
          Your GP surgery will give you guidance and help you understand what to
          do next. They&apos;ll also give you another blood test to check your
          cholesterol level.
        </p>
      </Card.Content>
    </Card>

    <EmergencyCard />
  </>
);

const EmergencyCard: FC = () => (
  <Card className="result-care-card" cardType="emergency">
    <Card.Heading>Call 999 or go to A&E now if:</Card.Heading>
    <Card.Content>
      <p>you notice any of these signs of diabetes:</p>
      <ul>
        <li>you&apos;re feeling sick, being sick or have stomach pain</li>
        <li>
          you&apos;re breathing more quickly than usual or your heart is beating
          faster than usual
        </li>
        <li>you are struggling to stay awake or feel drowsy</li>
        <li>your breath has a fruity smell (like pear drop sweets)</li>
        <li>you feel confused or have difficulty concentrating</li>
        <li>you&apos;re feeling thirsty and needing to pee more often</li>
      </ul>
      <p>
        <PhoneAnchor
          phoneNumber="999"
          phoneNumberForScreenReaders="nine nine nine"
          displayText="Call 999"
        />
      </p>
      <p>
        <OpensInNewTabLink
          linkHref="https://www.nhs.uk/service-search/find-an-accident-and-emergency-service/"
          linkText="Find your nearest A&E"
          includeNewTabMessage={true}
        />
      </p>
    </Card.Content>
  </Card>
);

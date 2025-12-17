import React, { useEffect } from 'react';

import {
  OpenedFrom,
  OpensInNewTabLink
} from '../../lib/components/opens-in-new-tab-link';
import { InsetText, Card, DoAndDontList } from 'nhsuk-react-components';
import { useAuditEvent } from '../../hooks/eventAuditHook';
import PageLayout from '../../layouts/PageLayout';
import {
  AuditEventType,
  PatientResultsDetailedOpenedPage
} from '@dnhc-health-checks/shared';
import { RoutePath } from '../../lib/models/route-paths';
import { RiskLevelColor } from '../../lib/models/RiskLevelColor';
import { useHealthCheck } from '../../hooks/healthCheckHooks';

const DementiaPage: React.FC = () => {
  const healthCheck = useHealthCheck();
  const { triggerAuditEvent } = useAuditEvent();

  useEffect(() => {
    void triggerAuditEvent({
      eventType: AuditEventType.PatientResultsDetailedOpened,
      healthCheck: healthCheck.data,
      details: { page: PatientResultsDetailedOpenedPage.Dementia }
    });
  }, [healthCheck.data, triggerAuditEvent]);

  return (
    <PageLayout backToUrl={RoutePath.MainResultsPage}>
      <h1 className="nhsuk-heading-xl nhsuk-u-margin-bottom-5">Dementia</h1>
      <h2>How a healthy heart can lower your dementia risk</h2>
      <p>
        Dementia is caused by diseases of the brain. This leads to issues with
        memory, thinking and behaviour.
      </p>
      <p>
        The heart helps to protect the brain by pumping oxygen and nutrients
        carried in the blood to the brain.
      </p>
      <p>
        Keeping your heart healthy supports your brain, and can lower your risk
        of dementia.
      </p>
      <InsetText
        className={`${RiskLevelColor.Blue} nhsuk-u-margin-top-5 nhsuk-u-margin-bottom-5`}
      >
        <p>
          Dementia is not an inevitable part of ageing. Most older people do not
          get it, but those affected are mostly over 65.
        </p>
      </InsetText>
      <Card cardType="non-urgent">
        <Card.Heading>Speak to your GP if:</Card.Heading>
        <Card.Content>
          <p>
            you or a loved one are experiencing some or all of these symptoms:
          </p>
          <ul>
            <li>forgetting things</li>
            <li>trouble focusing or doing familiar tasks</li>
            <li>struggling to follow a conversation or find the right words</li>
            <li>getting confused about where you are or what time it is</li>
            <li>changes in your mood and personality</li>
          </ul>
        </Card.Content>
      </Card>
      <h2>How to reduce your risk of dementia</h2>
      <p>
        Although there’s no cure for dementia, up to 35% of cases could
        potentially be prevented or delayed through better heart health and
        lifestyle choices.
      </p>
      <h3>Manage existing health conditions</h3>
      <p>
        Some health conditions can increase the risk of dementia. To reduce your
        risk, it’s important to get treatment for the following conditions:
      </p>

      <ul>
        <li>depression</li>
        <li>diabetes</li>
        <li>high blood pressure</li>
        <li>high cholesterol</li>
        <li>untreated vision or hearing loss or impairment</li>
      </ul>

      <p>
        Managing these conditions with the appropriate medication, aids and
        therapy helps to reduce your risk of dementia.
      </p>

      <h3>Make healthy lifestyle choices</h3>
      <DoAndDontList listType="do" heading="Do:">
        <DoAndDontList.Item>
          be active every day - exercise helps blood flow to your brain
        </DoAndDontList.Item>
        <DoAndDontList.Item>
          stay socially and mentally active - it keeps your brain strong
        </DoAndDontList.Item>
        <DoAndDontList.Item>
          eat a balanced diet - include vegetables, fruits and lean proteins
          like chicken, fish and beans
        </DoAndDontList.Item>
        <DoAndDontList.Item>
          eat less processed meat, fried food, sugary sweets and drinks
        </DoAndDontList.Item>
        <DoAndDontList.Item>
          keep a healthy weight - too much weight strains the heart
        </DoAndDontList.Item>
        <DoAndDontList.Item>
          drink less alcohol - too much harms your heart and brain
        </DoAndDontList.Item>
        <DoAndDontList.Item>
          stop smoking - it reduces oxygen to your brain
        </DoAndDontList.Item>
      </DoAndDontList>
      <h2>Useful guidance</h2>
      <p>The following links open in a new tab.</p>
      <p>
        <OpensInNewTabLink
          linkHref="https://www.nhs.uk/conditions/dementia/"
          linkText="Read NHS guidance on dementia"
          includeNewTabMessage={false}
          auditEventTriggeredOnClick={{
            eventType: AuditEventType.ExternalResourceOpened,
            openedFrom: OpenedFrom.ResultsDementia,
            healthCheck: healthCheck.data
          }}
        />
      </p>
      <p>
        <OpensInNewTabLink
          linkHref="https://www.dementiauk.org/information-and-support/how-we-can-support-you/"
          linkText="Get help and support from Dementia UK"
          includeNewTabMessage={false}
          auditEventTriggeredOnClick={{
            eventType: AuditEventType.ExternalResourceOpened,
            openedFrom: OpenedFrom.ResultsDementia,
            healthCheck: healthCheck.data
          }}
        />
      </p>
      <p>
        <OpensInNewTabLink
          linkHref="https://www.alzheimers.org.uk/find-support-near-you"
          linkText="Find support near you on the Alzheimer’s Society website"
          includeNewTabMessage={false}
          auditEventTriggeredOnClick={{
            eventType: AuditEventType.ExternalResourceOpened,
            openedFrom: OpenedFrom.ResultsDementia,
            healthCheck: healthCheck.data
          }}
        />
      </p>
    </PageLayout>
  );
};

export default DementiaPage;

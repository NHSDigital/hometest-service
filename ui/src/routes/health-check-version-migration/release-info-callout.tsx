import React from 'react';
import { ImportantCallout } from '../../lib/components/important-callout';

interface ReleaseInfoProps {
  currentVersion: string;
}

enum Section {
  CHECK_ELIGIBILITY = 'Check Eligibility',
  ABOUT_YOU = 'About You',
  PHYSICAL_ACTIVITY = 'Physical Activity',
  ALCOHOL_CONSUMPTION = 'Alcohol Consumption',
  ENTER_BODY_MEASUREMENTS = 'Enter Body Measurements',
  CHECK_YOUR_BLOOD_PRESSURE = 'Check Your Blood Pressure'
}

type SectionInfo = {
  section: Section;
  description: string;
};

enum ReleaseVersion {
  V1 = '1.0.0',
  V2 = '2.0.0',
  V3 = '3.0.0'
}

type ReleaseInfoOnSections = {
  dataModelVersion: ReleaseVersion;
  sectionChanges: SectionInfo[];
};

// newest release first -> oldest last
const serviceReleaseChanges: ReleaseInfoOnSections[] = [
  {
    dataModelVersion: ReleaseVersion.V3,
    sectionChanges: [
      {
        section: Section.CHECK_ELIGIBILITY,
        description:
          'Question to check if you received an invitation to the service.'
      }
    ]
  },
  {
    dataModelVersion: ReleaseVersion.V2,
    sectionChanges: [
      {
        section: Section.ABOUT_YOU,
        description: 'New questions about your health and family history.'
      }
    ]
  },
  {
    dataModelVersion: ReleaseVersion.V1,
    sectionChanges: []
  }
];

export const ReleaseInfo: React.FC<ReleaseInfoProps> = ({ currentVersion }) => {
  const releaseNotes: ReleaseInfoOnSections[] = [];
  const currentMajorVersion = currentVersion
    .split('.')[0]
    .concat('.0.0') as ReleaseVersion;

  for (const element of serviceReleaseChanges) {
    if (element.dataModelVersion === currentMajorVersion) break;

    releaseNotes.push(element);
  }

  return (
    <ImportantCallout title="Updates">
      {releaseNotes.map((release, index) => (
        <div key={index}>
          <p>Release: {release.dataModelVersion}</p>
          {release.sectionChanges.map((sections, index) => (
            <div key={index} className="nhsuk-u-margin-4">
              <p>Section: {sections.section}</p>
              <ul>
                <li>{sections.description}</li>
              </ul>
            </div>
          ))}
        </div>
      ))}
    </ImportantCallout>
  );
};

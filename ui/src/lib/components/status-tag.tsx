import { SectionStatus } from '../../statuses/statusCalculator';

export function StatusTag({ status }: { status: string }) {
  switch (status as SectionStatus) {
    case SectionStatus.Completed:
      return <strong className="nhsuk-tag nhsuk-tag--green">{status}</strong>;

    case SectionStatus.CannotStartYet:
      return <strong className="nhsuk-tag nhsuk-tag--grey">{status}</strong>;

    case SectionStatus.Started:
      return <strong className="nhsuk-tag nhsuk-tag--white">{status}</strong>;

    case SectionStatus.NotStarted:
      return <strong className="nhsuk-tag nhsuk-tag--blue">{status}</strong>;

    default:
      return <></>;
  }
}

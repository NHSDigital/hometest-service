import { render } from '@testing-library/react';
import TaskList from '../../../../lib/components/task-list/task-list';
import { SectionStatus } from '../../../../statuses/statusCalculator';
import { BrowserRouter } from 'react-router-dom';

describe('Task list', () => {
  it('matches snapshot with link', () => {
    const { container } = render(
      <BrowserRouter>
        <TaskList>
          <TaskList.Item
            title="Testing"
            itemHref="/"
            status={SectionStatus.Completed}
          />
        </TaskList>
      </BrowserRouter>
    );

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot without link', () => {
    const { container } = render(
      <BrowserRouter>
        <TaskList>
          <TaskList.Item
            title="Testing"
            status={SectionStatus.CannotStartYet}
          />
        </TaskList>
      </BrowserRouter>
    );

    expect(container).toMatchSnapshot();
  });
});

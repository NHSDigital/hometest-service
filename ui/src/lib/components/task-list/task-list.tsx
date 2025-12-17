'use client';
import React, { type FC, type HTMLProps } from 'react';
import classNames from 'classnames';
import { StatusTag } from '../status-tag';
import { Link } from 'react-router-dom';

type TaskListProps = HTMLProps<HTMLUListElement>;

interface ITaskList extends FC<TaskListProps> {
  Item: FC<TaskListItemProps>;
}

const TaskList: ITaskList = ({ className, ...rest }) => (
  <ul className={classNames('app-task-list', className)} {...rest}></ul>
);

interface TaskListItemProps extends HTMLProps<HTMLLIElement> {
  title: string;
  itemHref?: string;
  itemOnClick?: React.MouseEventHandler<HTMLAnchorElement>;
  status: string;
}

const TaskListItem: FC<TaskListItemProps> = ({
  title,
  itemHref,
  status,
  itemOnClick
}) => {
  const statusTagId = `${title.replaceAll(' ', '')}-status`;

  const onLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (itemOnClick) {
      itemOnClick(e);
    }
  };

  return (
    <li
      className={`app-task-list__item ${itemHref ? 'app-task-list__item--with-link' : ''}`}
    >
      <div className="app-task-list__name-and-hint">
        {itemHref ? (
          <Link
            className="app-link app-task-list__link"
            to={itemHref}
            aria-describedby={statusTagId}
            onClick={onLinkClick}
          >
            {title}
          </Link>
        ) : (
          title
        )}
      </div>
      <div className="app-task-list__status" id={statusTagId}>
        <StatusTag status={status} />
      </div>
    </li>
  );
};

TaskList.Item = TaskListItem;

export default TaskList;

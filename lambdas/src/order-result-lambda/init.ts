import {Commons, ConsoleCommons} from "../lib/commons";
import {OrderService} from "../lib/db/order-db";
import {PostgresDbClient} from "../lib/db/db-client";
import {retrieveMandatoryEnvVariable} from "../lib/utils/utils";


export interface Environment {
  commons: Commons;
  orderService: OrderService;
}

export function init(): Environment {
  const commons = new ConsoleCommons();
  const dbClient = new PostgresDbClient(retrieveMandatoryEnvVariable('DATABASE_URL'));
  const orderService = new OrderService(dbClient, commons);

  return {
    commons,
    orderService,
  };
}

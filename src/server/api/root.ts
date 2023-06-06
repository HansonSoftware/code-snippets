import { snippetRouter } from "./routers/snippet";
import { topicRouter } from "./routers/topic";
import { createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  topic: topicRouter,
  snippet: snippetRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

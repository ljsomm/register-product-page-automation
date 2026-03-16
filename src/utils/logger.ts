import pino from "pino";

const LOG_LEVELS = ["trace", "debug", "info", "warn", "error", "fatal"] as const;
type LogLevel = (typeof LOG_LEVELS)[number];

const resolveLogLevel = (): LogLevel => {
  const env = (process.env.LOG_LEVEL || "info").toLowerCase() as LogLevel;
  return LOG_LEVELS.includes(env) ? env : "info";
};

export const logger = pino({
  level: resolveLogLevel(),
  transport: {
    target: "pino-pretty",
    options: {
      ignore: "pid,hostname,name",
    },
  },
});

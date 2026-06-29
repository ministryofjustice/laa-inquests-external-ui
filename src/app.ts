import express from "express";
import morgan from "morgan";
import indexRouter from "#src/infrastructure/express/routes/index.js";
import livereload from "connect-livereload";
import config from "#src/infrastructure/config/config.js";
import { setupMiddleware } from "./infrastructure/express/middleware/index.js";
import {
  handleApplicationError,
  handleNotFound,
  handleServerError,
} from "#src/infrastructure/express/middleware/errorHandlers.js";

const app = express();

setupMiddleware(app);

if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}

app.use("/", indexRouter);
app.use(handleNotFound);
app.use(handleApplicationError);
app.use(handleServerError);

if (process.env.NODE_ENV === "development") {
  app.use(livereload());
}

app.listen(config.app.port, () => {
  console.log(`Listening on http://localhost:${config.app.port}/...`);
});

export default app;

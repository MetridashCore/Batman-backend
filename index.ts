import "dotenv/config";
import express from "express";
import prod from "./startup/prod";
import config from "./startup/config";
import routes from "./startup/routes";

const app = express();

config();
prod(app);
routes(app);

const port = process.env.PORT || 8000;

app.listen(port, () => console.log("Server started"));

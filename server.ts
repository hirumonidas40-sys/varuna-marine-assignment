import express from "express";
import cors from "cors";
import { json } from "body-parser";
import routes from "./adapters/http/routes";

const app = express();
app.use(cors());
app.use(json());

app.use("/api", routes);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`Server listening on ${port}`));

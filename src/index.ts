import { createServer, IncomingMessage, ServerResponse } from "http";
import * as mongoose from "mongoose";
import * as dotenv from "dotenv";

// import with .js, and not ts.
// for more info: https://devblogs.microsoft.com/typescript/announcing-typescript-4-7/#type-in-package-json-and-new-extensions
import { getExample, mainRoute, createRoute,updatePrivileges, createEvent, deleteEvent, updateEvent, getEventsByOrganizer, getEventsByIdOrCategory } from "./routes.js";
import { CREATE_EVENT, GET_SEGEL, LOGIN, MAIN_ROOT, PERMISSION, SIGNUP, EVENTS_BY_ORGANIZER } from "./const.js";
import { loginRoute, signupRoute } from "./auth.js";

// For environment-variables
dotenv.config();
const port = process.env.PORT || 3000;

// Connect to mongoDB
const dbURI = `mongodb+srv://OsamaSayah:${process.env.DBPASS}@pws.jqme9mr.mongodb.net/PWS-HW3`;
await mongoose.connect(dbURI);

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  const route = createRoute(req.url, req.method);
  if (req.url.match(/\/api\/event\/organizer\/\w+/)) {
    if(req.method === "GET"){
      getEventsByOrganizer(req, res);
      return;
    }
  }
  if (req.url.match(/\/api\/event\/\w+/)) {
    if(req.method === "DELETE"){
      deleteEvent(req, res);
      return;
    }
    if(req.method === "PUT"){
      updateEvent(req, res);
      return;
    }
    if(req.method === "GET"){
      getEventsByIdOrCategory(req, res);
      return;
    }
  }
  switch (route) {
    case LOGIN:
      loginRoute(req, res);
      break;
    case SIGNUP:
      signupRoute(req, res);
      break;
    case PERMISSION:
      updatePrivileges(req, res);
      break;
    case MAIN_ROOT:
      mainRoute(req, res);
      break;
    case CREATE_EVENT:
      createEvent(req, res);
      break;
    default:
      res.statusCode = 404;
      res.write(" API Path not found"); // build in js function, to convert json to a string
      res.end();
  }
});

server.listen(port);
console.log(`Server running! port ${port}`);

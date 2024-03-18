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
  if (req.url.match(/\/api\/event\/organizer\/[\w=&?]*/)) {
    if(req.method === "GET"){
      getEventsByOrganizer(req, res);
      return;
    }
  }
  if (req.url.match(/\/api\/event\/[\w=&?]*/)) {
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
    if(req.method === "POST"){
      createEvent(req, res);
      return;
    }
  }
  if (req.url.match(/\/api\/login\?[\w=&?]*/) && req.method === "POST") {
    loginRoute(req, res);
    return;
  }

  if (req.url.match(/\/api\/signup\?[\w=&]*/) && req.method === "POST") {
    signupRoute(req, res);
    return;
  }

  if (req.url.match(/\/api\/permission\?[\w=&]*/) && req.method === "PUT") {
    updatePrivileges(req, res);
    return;
  }




  switch (route) {
    case LOGIN:
      loginRoute(req, res);
      return;
    case SIGNUP:
      signupRoute(req, res);
      return;
    case PERMISSION:
      updatePrivileges(req, res);
      return;
    case MAIN_ROOT:
      mainRoute(req, res);
      return;
    case CREATE_EVENT:
      createEvent(req, res);
      return;
    default:
      res.statusCode = 404;
      res.write(" API Path not found"); // build in js function, to convert json to a string
      res.end();
      return;
  }
});

server.listen(port);
console.log(`Server running! port ${port}`);

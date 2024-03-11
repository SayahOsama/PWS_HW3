import { IncomingMessage, ServerResponse } from "http";
import { protectedRout } from "./auth.js";
import { ERROR_401 } from "./const.js";
import Event from "./models/events.js";
import User from "./models/users.js";

const exampleData = {
  title: "This is a nice example!",
  subtitle: "Good Luck! :)",
};

// const getCookies = (req) => {
//   const cookieHeader = req.headers['cookie'];
//   const cookies = {};

//   if (cookieHeader) {
//     const cookieStrings = cookieHeader.split(';');
//     cookieStrings.forEach(cookieString => {
//       const parts = cookieString.split('=');
//       const name = parts[0].trim();
//       const value = parts[1] ? parts[1].trim() : '';
//       cookies[name] = value;
//     });
//   }

//   return cookies;
// };

const parseSearchParams = (url: string): { [key: string]: string } => {
  const searchParams: { [key: string]: string } = {};

  if (url) {
    const queryIndex = url.indexOf("?");

    if (queryIndex !== -1) {
      const queryString = url.slice(queryIndex + 1);
      const queryParams = queryString.split("&");

      queryParams.forEach((pair) => {
        const [key, value] = pair.split("=");
        searchParams[key] = decodeURIComponent(value);
      });
    }
  }

  return searchParams;
};

export const createRoute = (url: string, method: string) => {
  return `${method} ${url}`;
};

export const mainRoute = (req: IncomingMessage, res: ServerResponse) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html");
  res.write("<h1>Hello Yedidi! API:</h1>");
  res.write(`<ul>
      <li>segel info. GET /api/segel</li>
      <li>signin. POST /api/signin</li>
      <li>login. POST /api/login</li>      
  </ul>`);
  res.end();
};

export const getEventsByIdOrCategory = async (req: IncomingMessage, res: ServerResponse) => {
  const user = protectedRout(req, res);
  if (user == ERROR_401) {
    res.statusCode = 401;
    // res.setHeader("Content-Type", "application/json");
    res.write("user is not authorized");
    res.end();
    return;
  }
  let skip = 0;
  let limit = 50;
  let IdOrCategory;
  const { url } = req;
  if (url) {
    const searchParams = parseSearchParams(url);
    if(searchParams["skip"]){
      skip = parseInt(searchParams["skip"]);
    }
    if(searchParams["limit"]){
      limit = parseInt(searchParams["limit"]);
    }
    const urlParts = url.split("?")[0].split("/");
    const IdOrCategoryIndex = urlParts.indexOf("event") + 1;
    IdOrCategory = decodeURIComponent(urlParts[IdOrCategoryIndex]);
  }
  let event;
  try{
    const id = IdOrCategory;
    event = await Event.findById(id);
    if(event){
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify( event ));
      return;
    }
  }catch(error){}
  const validEvents = ['Charity Event', 'Concert', 'Conference', 'Convention', 'Exhibition', 'Festival', 'Product Launch', 'Sports Event'];
  if(!validEvents.includes(String(IdOrCategory))){
    res.statusCode = 404;
    res.end();
    return;
  }
  let events;
  try{
    events = await Event.find({category: IdOrCategory })
                              .skip(skip)
                              .limit(limit);
  }catch(error){
    res.statusCode = 400;
    res.end(error.message);
    return;
  }

    
  res.statusCode = 200;
  res.end(
    JSON.stringify(events)
  );
};

export const getEventsByOrganizer = async (req: IncomingMessage, res: ServerResponse) => {
  const user = protectedRout(req, res);
  if (user == ERROR_401) {
    res.statusCode = 401;
    // res.setHeader("Content-Type", "application/json");
    res.write("user is not authorized");
    res.end();
    return;
  }

  let skip = 0;
  let limit = 50;
  let organizer;
  const { url } = req;
  if (url) {
    const searchParams = parseSearchParams(url);
    if(searchParams["skip"]){
      skip = parseInt(searchParams["skip"]);
    }
    if(searchParams["limit"]){
      limit = parseInt(searchParams["limit"]);
    }
    const urlParts = url.split("?")[0].split("/");
    const organizerIndex = urlParts.indexOf("organizer") + 1;
    organizer = decodeURIComponent(urlParts[organizerIndex]);
  }
  let events;
  try{
    events = await Event.find({ organizer })
                              .skip(skip)
                              .limit(limit);
  }catch(error){
    res.statusCode = 400;
    res.end(error.message);
    return;
  }

    
  res.statusCode = 200;
  res.end(
    JSON.stringify( events)
  );
};

export const updatePrivileges = (req: IncomingMessage, res: ServerResponse) => {
  const user = protectedRout(req, res);
  if (user == ERROR_401) {
    res.statusCode = 401;
    // res.setHeader("Content-Type", "application/json");
    res.write("user is not authorized");
    res.end();
    return;
  }

  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });
  req.on("end", async () => {
    // Parse request body as JSON
    let privilege;
    try {
      privilege = JSON.parse(body);
    } catch (error) {
      res.statusCode = 400;
      res.end("Invalid JSON format in request body.");
      return;
    }

    const bodyKeys = Object.keys(privilege);
    if (bodyKeys.length !== 2 || !bodyKeys.includes("username") || !bodyKeys.includes("permission")) {
      res.statusCode = 400;
      res.end("Request body must contain only 'username' and 'permission' fields.");
      return;
    }
    const loggedUser = await User.findById(user.id);
    const username = privilege.username;
    const permission = privilege.permission;
    const existingUser = await User.findOne({ username });
    if (!existingUser) {
      res.statusCode = 404;
      res.end("User does not exist");
      return;
    }

    if(loggedUser.permission && loggedUser.permission != "A"){
      res.statusCode = 403;
      res.end("you lack sufficient permissions to update privilege.");
      return;
    }

    if(permission == "A"){
      res.statusCode = 403;
      res.end("you are forbidden to grant this permission.");
      return;
    }

    if(permission != "M" && permission != "W"){
      res.statusCode = 400;
      res.end("there is no such permission.");
      return;
    }
    // const updatedUser = await User.findOneAndUpdate({ username }, {permission: {permission}}, { new: true });
    existingUser.permission = permission;
    await existingUser.save();
    res.statusCode = 200;
    res.end("successfully updated the privileges");
  });
};

export const updateEvent = async (req: IncomingMessage, res: ServerResponse) => {
  const user = protectedRout(req, res);
  if (user == ERROR_401) {
    res.statusCode = 401;
    // res.setHeader("Content-Type", "application/json");
    res.write("user is not authorized");
    res.end();
    return;
  }
  const loggedUser = await User.findById(user.id);
  if(loggedUser.permission != "A" && loggedUser.permission != "M"){
    res.statusCode = 403;
    res.end("you lack sufficient permissions to update event.");
    return;
  }
  const id = req.url.split("/")[3];


  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });
  req.on("end", async () => {
    // Parse request body as JSON
    let fields;
    try {
      fields = JSON.parse(body);
    } catch (error) {
      res.statusCode = 400;
      res.end("Invalid JSON format in request body.");
      return;
    }

    const bodyKeys = Object.keys(fields);
    // if (bodyKeys.length == 0) {
    //   res.statusCode = 400;
    //   res.end("Request body must contain atleast one field to update.");
    //   return;
    // }

    // bodyKeys.forEach((field)=>{
    //   switch (field) {
    //     case "title":
    //       break;
    //     case "category":
    //       break;
    //     case "description":
    //       break;
    //     case "organizer":
    //       break;
    //     case "start_date":
    //       break;
    //     case "end_date":
    //       break;
    //     case "location":
    //       break;
    //     case "tickets":
    //       break;
    //     case "image":
    //       break;
    //     default:
    //       // Handle unexpected keys
    //       res.statusCode = 400;
    //       res.end(`Unexpected field '${field}' in request body.`);
    //       return;
    //   }
    // });

    let eventToUpdate;
    try{
      eventToUpdate = await Event.findById(id);
    }catch(error){}

    if(!eventToUpdate){
      res.statusCode = 404;
      res.end("event does not exist.");
      return;
    }
    
    bodyKeys.forEach(async (field)=>{
      switch (field) {
        case "title":
          eventToUpdate.title = fields["title"];
          break;
        case "category":
          eventToUpdate.category = fields["category"];
          break;
        case "description":
          eventToUpdate.description = fields["description"];
          break;
        case "organizer":
          eventToUpdate.organizer = fields["organizer"];
          break;
        case "start_date":
          eventToUpdate.start_date = fields["start_date"];
          break;
        case "end_date":
          eventToUpdate.end_date = fields["end_date"];
          break;
        case "location":
          eventToUpdate.location = fields["location"];
          break;
        case "tickets":
          eventToUpdate.tickets = fields["tickets"];
          break;
        case "image":
          eventToUpdate.image = fields["image"];
          break;
        default:
          // Handle unexpected keys
          res.statusCode = 400;
          res.end(`Unexpected field '${field}' in request body.`);
          return;
      }
      
      try{
        await eventToUpdate.save();
      }catch(error){
        res.statusCode = 400;
        res.end(error.message);
        return;
      }
  });
    

  
  res.statusCode = 200;
  res.end(
    JSON.stringify(
      {_id: eventToUpdate._id}
    )
  );
  });
};

export const deleteEvent = async (req: IncomingMessage, res: ServerResponse) => {
  const user = protectedRout(req, res);
  if (user == ERROR_401) {
    res.statusCode = 401;
    // res.setHeader("Content-Type", "application/json");
    res.write("user is not authorized");
    res.end();
    return;
  }
  const loggedUser = await User.findById(user.id);
  if(loggedUser.permission != "A"){
    res.statusCode = 403;
    res.end("you lack sufficient permissions to delete event.");
    return;
  }
  const id = req.url.split("/")[3];
  try {
    // Use Mongoose to find and delete the event by its ID
    await Event.findByIdAndDelete(id);
  } catch (error) {}
  res.statusCode = 200;
  res.end();
};

export const createEvent = (req: IncomingMessage, res: ServerResponse) => {
  const user = protectedRout(req, res);
  if (user == ERROR_401) {
    res.statusCode = 401;
    // res.setHeader("Content-Type", "application/json");
    res.write("user is not authorized");
    res.end();
    return;
  }

  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });
  req.on("end", async () => {
    // Parse request body as JSON
    let event;
    try {
      event = JSON.parse(body);
    } catch (error) {
      res.statusCode = 400;
      res.end("Invalid JSON format in request body.");
      return;
    }

    const bodyKeys = Object.keys(event);
    if (bodyKeys.length < 8 || bodyKeys.length > 9 || !bodyKeys.includes("title") || !bodyKeys.includes("category") || !bodyKeys.includes("description")
        || !bodyKeys.includes("organizer") || !bodyKeys.includes("start_date") || !bodyKeys.includes("end_date") || !bodyKeys.includes("location") 
        || !bodyKeys.includes("tickets")) {
        res.statusCode = 400;
        res.end("Request body must contain all the required fields.");
        return;
    }

    const loggedUser = await User.findById(user.id);
    if(loggedUser.permission != "A" && loggedUser.permission != "M"){
      res.statusCode = 403;
      res.end("you lack sufficient permissions to create event.");
      return;
    }
    const title = event.title;
    const category = event.category;
    const description = event.description;
    const organizer = event.organizer;
    const start_date = event.start_date;
    const end_date = event.end_date;
    const location = event.location;
    const tickets = event.tickets;
    let image;
    let newEvent;
    const containsImage = bodyKeys.includes("image");
    try{
      if(containsImage){
        image = event.image;
        newEvent = new Event({
          title: title,
          category: category,
          description: description,
          organizer: organizer,
          start_date: start_date, 
          end_date: end_date,
          location: location, 
          tickets: tickets,
          image: image, 
        });
      }else{
        newEvent = new Event({
          title: title,
          category: category,
          description: description,
          organizer: organizer,
          start_date: start_date, 
          end_date: end_date,
          location: location, 
          tickets: tickets,
        });
      }
      await newEvent.save(newEvent);
    }catch(error){
      res.statusCode = 400;
      res.end(error.message);
      return;
    }
    res.statusCode = 201;
    res.end(
      JSON.stringify(
        {_id: newEvent._id}
      )
    );
  });
};

export const getExample = (req: IncomingMessage, res: ServerResponse) => {
  const user = protectedRout(req, res);
  if (user !== ERROR_401) {
    res.statusCode = 401;
    // res.setHeader("Content-Type", "application/json");
    res.write(JSON.stringify({ data: { ...exampleData }, user: { ...user } })); // build in js function, to convert json to a string
    res.end();
    return;
  }
};

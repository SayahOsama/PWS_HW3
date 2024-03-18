
# HW3 Template

This repo contain a project template for your HW3 task.

You are getting, "out of the box":
* Node server with Typescript.
* API routing template.
* dev, build, start and test scripts.
* Authantication with JWT example.

## How to start?
* Fork or clone this project.
* Update name and author fields in `package.json`.
* Run `npm i` to initialize the project and install dependencies.
* Start implementing your server logic.

## How to work with it?
The following npm commands are supplied (invoke with `npm run {command}`):

* `dev` -  Run tsc on watch mode, and start the server compiled file. Great for developing.
* `build` - Run tsc only.
* `start` - Run the compiled server file, without re-building.
* `test` - Run a simple test case (found in `scritps/test.js`).

For more details see `package.json` file.

## About the dependecies
First of all, we are recommend reading more about each of those npm modules.

* `bcrypt` - for hash passwords & compare the hashed strings. By  defualt, hash with salt. Check the comments in `src/auth.ts`.
* `jsonwebtoken` - for creating JWT. you can create & verify. Notice! you need to create a secret for sign the token.
* `uuid` - create random UUID.
* `mongoose` - a MongoDB object modeling tool. for usage examples see - Check https://github.com/pws236369/lecture-7-node-and-db.

> :warning: **You are not allowed to install any other dependancies to your submission**

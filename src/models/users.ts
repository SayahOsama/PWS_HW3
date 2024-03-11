import * as mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, minLength: 1 },
    password: { type: String, required: true,  minLength: 1},
    permission: { type: String,required: true, enum:["W","M","A"]},
});

export default mongoose.model("User", userSchema);

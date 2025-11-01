const mongoose = require('mongoose');

const connectionString = process.env.MONGO_URI || 'mongodb://localhost:27017/myDB';

const dbConnect = async()=>{

    try{
       const resp = await mongoose.connect(connectionString); // resolves into a mongoose connection object  (technically a Mongoose instance))
       // mongoose is the object here and mongoose.connect is the function available. and mongoose.connect mutates the mongoose object and returns it. 

       console.log("db connected");
     //  console.log(resp);
       console.log(resp.connection.name);    // works
       console.log(mongoose.connection.name); //  also works (more common) logs myDB
     // resp and mongoose are the same thing here. resp holds the ref of the mongoose instance

     return resp;

    }catch(err) {
        console.log("Connection failed", err);
        process.exit(1);
    }
  
}

module.exports = dbConnect;

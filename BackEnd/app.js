/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/



const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
const bodyParser = require('body-parser')
const express = require('express')
const { v4: uuidv4} = require('uuid')

const ddbClient = new DynamoDBClient({ region: process.env.TABLE_REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

let tableNameEvent = "eventTable";
let tableNameUser = "userTable";
if (process.env.ENV && process.env.ENV !== "NONE") {
  tableNameEvent = tableNameEvent + '-' + process.env.ENV;
  tableNameUser = tableNameUser + '-' + process.env.ENV;
  
}


const userIdPresent = false; // TODO: update in case is required to use that definition
const partitionKeyName = "id";
const partitionKeyType = "S";
const sortKeyName = "";
const sortKeyType = "";
const hasSortKey = sortKeyName !== "";
const eventsPath = "/events";

const userPath = "/user"

const UNAUTH = 'UNAUTH';
const hashKeyPath = '/:' + partitionKeyName;
const sortKeyPath = hasSortKey ? '/:' + sortKeyName : '';

// declare a new express app
const app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "*")
  next()
});

// convert url string param to expected Type
const convertUrlType = (param, type) => {
  switch(type) {
    case "N":
      return Number.parseInt(param);
    default:
      return param;
  }
}



/************************************
* HTTP Get method to list all events sorted by most soonest start *
************************************/

app.get(eventsPath+"/upcoming", async function(req, res) {
  console.log("start upcoming")
 
  var params = {
    TableName: tableNameEvent,
  };
  

  try {
    const data = await ddbDocClient.send(new ScanCommand(params));
    
    data.Items.sort((a, b) => {
    const dateA = new Date(a.date + "T" + a.time);
    const dateB = new Date(b.date + "T" + b.time);
    return dateA - dateB;
  });
    
    res.json(data.Items);
  } catch (err) {
    console.log(err);
    res.statusCode = 500;
    res.json({error: 'Could not load items: ' + err.message});
  }
});
/************************************
* HTTP Get method to get all events on a given day *
************************************/

app.get("/events/date/:date", async function(req, res) {
  const date = req.params.date;
  var params = {
    TableName: tableNameEvent,
    Select: 'ALL_ATTRIBUTES',
    
    FilterExpression: "contains(#date, :date)",
    ExpressionAttributeNames:{"#date": 'date' },
    ExpressionAttributeValues:{
      ":date":date}
    };

  try {
    const data = await ddbDocClient.send(new ScanCommand(params));
    data.Items.sort((a, b) => {
    const dateA = new Date(a.date + "T" + a.time);
    const dateB = new Date(b.date + "T" + b.time);
    return dateA - dateB;
  });
    res.json(data.Items);
    
  } catch (err) {
    print(err);
    res.statusCode = 500;
    res.json({error: 'Could not load items: ' + err.message});
  }
});


/************************************
* HTTP Get method to search all events for term *
************************************/

app.get("/events/search/:term", async function(req, res) {
  const term = req.params.term;
  var params = {
    TableName: tableNameEvent,
    Select: 'ALL_ATTRIBUTES',
    Limit: 10,
    FilterExpression: "contains(#title,:term) OR contains(#tags,:term) OR contains(#description,:term)",
    ExpressionAttributeNames:{"#title": "title","#tags":"tags","#description":"description"},
    ExpressionAttributeValues:{
      ":term":term}
    };

  try {
    const data = await ddbDocClient.send(new ScanCommand(params));
    data.Items.sort((a, b) => {
    const dateA = new Date(a.date + "T" + a.time);
    const dateB = new Date(b.date + "T" + b.time);
    return dateA - dateB;
  });
    res.json(data.Items);
    
  } catch (err) {
    print(err);
    res.statusCode = 500;
    res.json({error: 'Could not load items: ' + err.message});
  }
});


/************************************
* HTTP Get method to list all sport events *
************************************/

app.get("/events/sport", async function(req, res) {
  var params = {
    TableName: tableNameEvent,
    Select: 'ALL_ATTRIBUTES',
    Limit: 10,
    FilterExpression: "contains(#tag,:tag)",
    ExpressionAttributeNames:{"#tag": "tags"},
    ExpressionAttributeValues:{
      ":tag":"sport"}
    };

  try {
    const data = await ddbDocClient.send(new ScanCommand(params));
    data.Items.sort((a, b) => {
    const dateA = new Date(a.date + "T" + a.time);
    const dateB = new Date(b.date + "T" + b.time);
    return dateA - dateB;
  });
    res.json(data.Items);
    
  } catch (err) {
    print(err);
    res.statusCode = 500;
    res.json({error: 'Could not load items: ' + err.message});
  }
});

/************************************
* HTTP Get method to list all gaming events *
************************************/

app.get("/events/gaming", async function(req, res) {
  var params = {
    TableName: tableNameEvent,
    Select: 'ALL_ATTRIBUTES',
    Limit: 10,
    FilterExpression: "contains(#tag,:tag)",
    ExpressionAttributeNames:{"#tag": "tags"},
    ExpressionAttributeValues:{
      ":tag":"gaming"}
    };

  try {
    const data = await ddbDocClient.send(new ScanCommand(params));
    data.Items.sort((a, b) => {
    const dateA = new Date(a.date + "T" + a.time);
    const dateB = new Date(b.date + "T" + b.time);
    return dateA - dateB;
  });
    res.json(data.Items);
    
  } catch (err) {
    print(err);
    res.statusCode = 500;
    res.json({error: 'Could not load items: ' + err.message});
  }
});

/************************************
* HTTP Get method to list all volunteering events *
************************************/

app.get("/events/volunteer", async function(req, res) {
  var params = {
    TableName: tableNameEvent,
    Select: 'ALL_ATTRIBUTES',
    Limit: 10,
    FilterExpression: "contains(#tag,:tag)",
    ExpressionAttributeNames:{"#tag": "tags"},
    ExpressionAttributeValues:{
      ":tag":"volunteer"}
    };

  try {
    const data = await ddbDocClient.send(new ScanCommand(params));
    data.Items.sort((a, b) => {
    const dateA = new Date(a.date + "T" + a.time);
    const dateB = new Date(b.date + "T" + b.time);
    return dateA - dateB;
  });
    res.json(data.Items);
    
  } catch (err) {
    print(err);
    res.statusCode = 500;
    res.json({error: 'Could not load items: ' + err.message});
  }
});

/************************************
* HTTP Get method to list all arts/music events *
************************************/

app.get("/events/arts", async function(req, res) {
  var params = {
    TableName: tableNameEvent,
    Select: 'ALL_ATTRIBUTES',
    Limit: 10,
    FilterExpression: "contains(#tag,:tag)",
    ExpressionAttributeNames:{"#tag": "tags"},
    ExpressionAttributeValues:{
      ":tag":"music"}
    };

  try {
    const data = await ddbDocClient.send(new ScanCommand(params));
    data.Items.sort((a, b) => {
    const dateA = new Date(a.date + "T" + a.time);
    const dateB = new Date(b.date + "T" + b.time);
    return dateA - dateB;
  });
    res.json(data.Items);
    
  } catch (err) {
    print(err);
    res.statusCode = 500;
    res.json({error: 'Could not load items: ' + err.message});
  }
});


/************************************
* HTTP Get method to list all charity events *
************************************/

app.get("/events/charity", async function(req, res) {
  var params = {
    TableName: tableNameEvent,
    Select: 'ALL_ATTRIBUTES',
    Limit: 10,
    FilterExpression: "contains(#tag,:tag)",
    ExpressionAttributeNames:{"#tag": "tags"},
    ExpressionAttributeValues:{
      ":tag":"charity"}
    };

  try {
    const data = await ddbDocClient.send(new ScanCommand(params));
    data.Items.sort((a, b) => {
    const dateA = new Date(a.date + "T" + a.time);
    const dateB = new Date(b.date + "T" + b.time);
    return dateA - dateB;
  });
    res.json(data.Items);
    
  } catch (err) {
    print(err);
    res.statusCode = 500;
    res.json({error: 'Could not load items: ' + err.message});
  }
});

/************************************
* HTTP Get method to list all user eventsAttending *
************************************/

app.get("/user/events/:user", async function(req, res) {
  const userID = req.params.user;
  const userEmail = req.apiGateway.event.requestContext.identity.cognitoAuthenticationProvider.split(':CognitoSignIn:')[1];
  console.log("The associated user email with cognito is "+userEmail);
  
  
  const userParams = {
    TableName: tableNameUser,
    Key: {
      id: userID
    }
  };


  try {
  const userData = await ddbDocClient.send(new GetCommand(userParams));
  if (userData.Item && userData.Item.eventsAttending) {
    const eventsAttending = userData.Item.eventsAttending;
    
    const eventParams = {
      TableName: tableNameEvent,
      FilterExpression: "contains(:eventsAttending,#Id)",
      ExpressionAttributeNames:{"#Id":"id"},
      ExpressionAttributeValues:{
        ":eventsAttending": eventsAttending}
        
      };
      
      try {
    const data = await ddbDocClient.send(new ScanCommand(eventParams));
    
    if(data.Items.length == 0){
      
      res.statusCode = 404
      res.json({error: 'No items found'});
    }
    else{
    data.Items.sort((a, b) => {
    const dateA = new Date(a.date + "T" + a.time);
    const dateB = new Date(b.date + "T" + b.time);
    return dateA - dateB;
  });
    res.json(data.Items);
    }
    
  } catch (err) {
    res.statusCode = 500;
    res.json({error: 'Could not load items: ' + err.message});
  }
  }
  } catch (err) {
    console.log(err)
    res.statusCode = 500;
    res.json({error: 'Could not load items: ' + err.message});
  }
});

/************************************
* HTTP Get method to list all user eventsHosting *
************************************/

app.get("/user/events/hosting/:user", async function(req, res) {
  const userID = req.params.user;
  
  
  const userParams = {
    TableName: tableNameUser,
    Key: {
      id: userID
    }
  };


  try {
  const userData = await ddbDocClient.send(new GetCommand(userParams));
  if (userData.Item && userData.Item.eventsHosting) {
    const eventsHosting = userData.Item.eventsHosting;
    
    const eventParams = {
      TableName: tableNameEvent,
      FilterExpression: "contains(:eventsHosting,#Id)",
      ExpressionAttributeNames:{"#Id":"id"},
      ExpressionAttributeValues:{
        ":eventsHosting": eventsHosting}
        
      };
      
      try {
    const data = await ddbDocClient.send(new ScanCommand(eventParams));
    
    if(data.Items.length == 0){
      
      res.statusCode = 404
      res.json({error: 'No items found'});
    }
    else{
      data.Items.sort((a, b) => {
    const dateA = new Date(a.date + "T" + a.time);
    const dateB = new Date(b.date + "T" + b.time);
    return dateA - dateB;
  });
    res.json(data.Items);
    }
    
  } catch (err) {
    res.statusCode = 500;
    res.json({error: 'Could not load items: ' + err.message});
  }
  }
  } catch (err) {
    console.log(err)
    res.statusCode = 500;
    res.json({error: 'Could not load items: ' + err.message});
  }
});

/************************************
* HTTP Get method to list all user eventsHosted *
************************************/

app.get("/user/events/hosted/:user", async function(req, res) {
  const userID = req.params.user;
  
  
  const userParams = {
    TableName: tableNameUser,
    Key: {
      id: userID
    }
  };


  try {
  const userData = await ddbDocClient.send(new GetCommand(userParams));
  if (userData.Item && userData.Item.eventsHosted) {
    const eventsHosted = userData.Item.eventsHosted;
    
    const eventParams = {
      TableName: tableNameEvent,
      FilterExpression: "contains(:eventsHosted,#Id)",
      ExpressionAttributeNames:{"#Id":"id"},
      ExpressionAttributeValues:{
        ":eventsHosted": eventsHosted}
        
      };
      
      try {
    const data = await ddbDocClient.send(new ScanCommand(eventParams));
    
    if(data.Items.length == 0){
      
      res.statusCode = 404
      res.json({error: 'No items found'});
    }
    else{
      data.Items.sort((a, b) => {
    const dateA = new Date(a.date + "T" + a.time);
    const dateB = new Date(b.date + "T" + b.time);
    return dateA - dateB;
  });
    res.json(data.Items);
    }
    
  } catch (err) {
    res.statusCode = 500;
    res.json({error: 'Could not load items: ' + err.message});
  }
  }
  } catch (err) {
    console.log(err)
    res.statusCode = 500;
    res.json({error: 'Could not load items: ' + err.message});
  }
});

/************************************
* HTTP Get method to list all user eventsAttended *
************************************/

app.get("/user/events/attended/:user", async function(req, res) {
  const userID = req.params.user;
  
  
  const userParams = {
    TableName: tableNameUser,
    Key: {
      id: userID
    }
  };


  try {
  const userData = await ddbDocClient.send(new GetCommand(userParams));
  if (userData.Item && userData.Item.eventsAttended) {
    const eventsAttended = userData.Item.eventsAttended;
    
    const eventParams = {
      TableName: tableNameEvent,
      FilterExpression: "contains(:eventsAttended,#Id)",
      ExpressionAttributeNames:{"#Id":"id"},
      ExpressionAttributeValues:{
        ":eventsAttended": eventsAttended}
        
      };
      
      try {
    const data = await ddbDocClient.send(new ScanCommand(eventParams));
    
    if(data.Items.length == 0){
      
      res.statusCode = 404
      res.json({error: 'No items found'});
    }
    else{
      data.Items.sort((a, b) => {
    const dateA = new Date(a.date + "T" + a.time);
    const dateB = new Date(b.date + "T" + b.time);
    return dateA - dateB;
  });
    res.json(data.Items);
    }
    
  } catch (err) {
    res.statusCode = 500;
    res.json({error: 'Could not load items: ' + err.message});
  }
  }
  } catch (err) {
    console.log(err)
    res.statusCode = 500;
    res.json({error: 'Could not load items: ' + err.message});
  }
});

/************************************
* HTTP Get method to list all users *
************************************/

app.get(userPath, async function(req, res) {
  var params = {
    TableName: tableNameUser,
    Select: 'ALL_ATTRIBUTES',
    
    
  };
  
  try {
    const data = await ddbDocClient.send(new ScanCommand(params));
    res.json(data.Items);
  } catch (err) {
    console.log(err)
    res.statusCode = 500;
    res.json({error: 'Could not load items: ' + err.message});
  }
});

/************************************
* HTTP Get method to list all events *
************************************/

app.get(eventsPath, async function(req, res) {
  
  
  var params = {
    TableName: tableNameEvent,
    Select: 'ALL_ATTRIBUTES',
    
    
  };

  try {
    const data = await ddbDocClient.send(new ScanCommand(params));
    data.Items.sort((a, b) => {
    const dateA = new Date(a.date + "T" + a.time);
    const dateB = new Date(b.date + "T" + b.time);
    return dateA - dateB;
  });
    res.json(data.Items);
  } catch (err) {
    print(err);
    res.statusCode = 500;
    res.json({error: 'Could not load items: ' + err.message});
  }
});


/************************************
 * HTTP Get method get single event based on hashcode *  Done
 ************************************/
app.get(eventsPath + hashKeyPath, async function(req, res) {
  const condition = {}
  condition[partitionKeyName] = {
    ComparisonOperator: 'EQ'
  }

  if (userIdPresent && req.apiGateway) {
    condition[partitionKeyName]['AttributeValueList'] = [req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH ];
  } else {
    try {
      condition[partitionKeyName]['AttributeValueList'] = [ convertUrlType(req.params[partitionKeyName], partitionKeyType) ];
    } catch(err) {
      res.statusCode = 500;
      res.json({error: 'Wrong column type ' + err});
    }
  }

  let queryParams = {
    TableName: tableNameEvent,
    KeyConditions: condition
  }

  try {
    const data = await ddbDocClient.send(new QueryCommand(queryParams));
    
    if(data.Items.length == 0){
      
      res.statusCode = 404
      res.json({error: 'No items found'});
    }
    else{
    res.json(data.Items);
    }
    
  } catch (err) {
    res.statusCode = 500;
    res.json({error: 'Could not load items: ' + err.message});
  }
});

/************************************
 * HTTP Get method to get single user based on hashcode *  Done
 ************************************/
app.get(userPath + hashKeyPath, async function(req, res) {
  const condition = {}
  condition[partitionKeyName] = {
    ComparisonOperator: 'EQ'
  }

  if (userIdPresent && req.apiGateway) {
    condition[partitionKeyName]['AttributeValueList'] = [req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH ];
  } else {
    try {
      condition[partitionKeyName]['AttributeValueList'] = [ convertUrlType(req.params[partitionKeyName], partitionKeyType) ];
    } catch(err) {
      res.statusCode = 500;
      res.json({error: 'Wrong column type ' + err});
    }
  }

  let queryParams = {
    TableName: tableNameUser,
    KeyConditions: condition
  }

  try {
    const data = await ddbDocClient.send(new QueryCommand(queryParams));
    
    if(data.Items.length == 0){
      
      res.statusCode = 404
      res.json({error: 'No items found'});
    }
    else{
    res.json(data.Items);
    }
    
  } catch (err) {
    res.statusCode = 500;
    res.json({error: 'Could not load items: ' + err.message});
  }
});



/************************************
* HTTP put method for joining event * 
*************************************/
app.put("/join/:user/:event", async function(req, res) {
  
let attendees , capacity, eventsAttending
const userID = req.params.user;
const eventID = req.params.event;
  
  const eventParams = {
    TableName: tableNameEvent,
    Key: {
      id: eventID
    }
  };
  
  const userParams = {
    TableName: tableNameUser,
    Key: {
      id: userID
    }
  };


  try {
  const eventData = await ddbDocClient.send(new GetCommand(eventParams));
  const userData = await ddbDocClient.send(new GetCommand(userParams));
  if (eventData.Item && eventData.Item.capacity && eventData.Item.attendees) {
    attendees = eventData.Item.attendees;
    capacity = eventData.Item.capacity
  }
  if (userData.Item && userData.Item.eventsAttending) {
    eventsAttending = userData.Item.eventsAttending;
  }
} catch (err) {
  res.status(500).json({ error: err.message, url: req.url, body: req.body });
  return;
}
  
  
  if (attendees.length < capacity){
    attendees.push(userID);
    eventsAttending.push(eventID);
  }
  

  // Update the event's attendees in DynamoDB with a condition to ensure data consistency
  const eventUpdateParams = {
  TableName: tableNameEvent,
  Key: {
    id: eventID
  },
  UpdateExpression: 'SET attendees = :newAttendees',
  ExpressionAttributeValues: {
    ':newAttendees': attendees
  },
  ReturnValues: 'ALL_NEW'
  };
  
  const userUpdateParams = {
  TableName: tableNameUser,
  Key: {
    id: userID
  },
  UpdateExpression: 'SET eventsAttending = :newAttending',
  ExpressionAttributeValues: {
    ':newAttending': eventsAttending
  },
  ReturnValues: 'ALL_NEW'
  };

  try {
    const eventData = await ddbDocClient.send(new UpdateCommand(eventUpdateParams));
    const userData = await ddbDocClient.send(new UpdateCommand(userUpdateParams));
    res.json({ success: 'update call succeeded!', url: req.url, eventData});
  } catch (err) {
    // Handle conditional update failure here
    res.status(409).json({ error: 'Data has changed since you last read it', url: req.url });
  }
});

/************************************
* HTTP put method for leaving an event * Not Done Maybe Done
*************************************/
app.put("/leave/:user/:event", async function(req, res) {
  
let attendees , eventsAttending;
const userID = req.params.user;
const eventID = req.params.event;
  
  const eventParams = {
    TableName: tableNameEvent,
    Key: {
      id: eventID
    }
  };
  
  const userParams = {
    TableName: tableNameUser,
    Key: {
      id: userID
    }
  };


  try {
  const eventData = await ddbDocClient.send(new GetCommand(eventParams));
  const userData = await ddbDocClient.send(new GetCommand(userParams));
  if (eventData.Item && eventData.Item.capacity && eventData.Item.attendees) {
    attendees = eventData.Item.attendees;
    
  }
  if (userData.Item && userData.Item.eventsAttending) {
    eventsAttending = userData.Item.eventsAttending;
  }
} catch (err) {
  res.status(500).json({ error: err.message, url: req.url, body: req.body });
  return;
}
  
try{
  attendees = attendees.filter(user => user !== userID);
  eventsAttending = eventsAttending.filter(event => event !== eventID);
}catch(err){
  res.status(500).json({ error: err.message, url: req.url, body: req.body });
  return;
}
  



  // Update the event's attendees in DynamoDB with a condition to ensure data consistency
  const eventUpdateParams = {
  TableName: tableNameEvent,
  Key: {
    id: eventID
  },
  UpdateExpression: 'SET attendees = :newAttendees',
  ExpressionAttributeValues: {
    ':newAttendees': attendees
  },
  ReturnValues: 'ALL_NEW'
  };
  
  const userUpdateParams = {
  TableName: tableNameUser,
  Key: {
    id: userID
  },
  UpdateExpression: 'SET eventsAttending = :newAttending',
  ExpressionAttributeValues: {
    ':newAttending': eventsAttending
  },
  ReturnValues: 'ALL_NEW'
  };

  try {
    const eventData = await ddbDocClient.send(new UpdateCommand(eventUpdateParams));
    const userData = await ddbDocClient.send(new UpdateCommand(userUpdateParams));
    res.json({ success: 'update call succeeded!', url: req.url, eventData});
  } catch (err) {
    // Handle conditional update failure here
    res.status(409).json({ error: 'Data has changed since you last read it', url: req.url });
  }
});

/************************************
* HTTP put method for updating event * 
*************************************/

app.put("/events/:hashKeyPath", async function(req, res) {
  const { hashKeyPath } = req.params; // Assuming you extract the hash key from the request URL
  
  if (!hashKeyPath) {
    res.statusCode = 400;
    return res.json({ error: 'Missing hash key in request URL' });
  }

  const updatedAttributes = {};
  const expressionAttributeValues = {};

  for (const key in req.body) {
    // Exclude userId if you don't want to update it
    if (key !== 'userId') {
      updatedAttributes[key] = req.body[key];
      expressionAttributeValues[`:${key}`] = req.body[key];
    }
  }

  if (Object.keys(updatedAttributes).length === 0) {
    res.statusCode = 400;
    return res.json({ error: 'No attributes to update' });
  }

  const updateExpression = Object.keys(updatedAttributes)
    .map(key => `#${key} = :${key}`)
    .join(', ');

  const params = {
    TableName: tableNameEvent,
    Key: {
      // Specify the primary key(s) of the item to update
      // Assuming a single primary key attribute named "id"
      id: hashKeyPath
    },
    UpdateExpression: `SET ${updateExpression}`,
    ExpressionAttributeNames: Object.keys(updatedAttributes).reduce((acc, key) => {
      acc[`#${key}`] = key;
      return acc;
    }, {}),
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW' // Adjust this based on your needs
  };

  try {
    let data = await ddbDocClient.send(new UpdateCommand(params));
    res.json({ success: 'update call succeed!', url: req.url, data: data })
  } catch (err) {
    res.statusCode = 500;
    res.json({ error: err.message, url: req.url, body: req.body });
  }

});

/************************************
* HTTP put method for updating user *  Done
*************************************/

app.put("/user/:hashKeyPath", async function(req, res) {
  const { hashKeyPath } = req.params; // Assuming you extract the hash key from the request URL
  
  if (!hashKeyPath) {
    res.statusCode = 400;
    return res.json({ error: 'Missing hash key in request URL' });
  }

  const updatedAttributes = {};
  const expressionAttributeValues = {};

  for (const key in req.body) {
    // Exclude userId if you don't want to update it
    if (key !== 'userId') {
      updatedAttributes[key] = req.body[key];
      expressionAttributeValues[`:${key}`] = req.body[key];
    }
  }

  if (Object.keys(updatedAttributes).length === 0) {
    res.statusCode = 400;
    return res.json({ error: 'No attributes to update' });
  }

  const updateExpression = Object.keys(updatedAttributes)
    .map(key => `#${key} = :${key}`)
    .join(', ');

  const params = {
    TableName: tableNameUser,
    Key: {
      // Specify the primary key(s) of the item to update
      // Assuming a single primary key attribute named "id"
      id: hashKeyPath
    },
    UpdateExpression: `SET ${updateExpression}`,
    ExpressionAttributeNames: Object.keys(updatedAttributes).reduce((acc, key) => {
      acc[`#${key}`] = key;
      return acc;
    }, {}),
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW' // Adjust this based on your needs
  };

  try {
    let data = await ddbDocClient.send(new UpdateCommand(params));
    res.json({ success: 'update call succeed!', url: req.url, data: data })
  } catch (err) {
    res.statusCode = 500;
    res.json({ error: err.message, url: req.url, body: req.body });
  }

});

/************************************
* HTTP put method for updating user interests *  Done
*************************************/

app.put("/user/tags/:user", async function(req, res) {
  const userID = req.params.user; // Assuming you extract the hash key from the request URL
  const tag = req.body.interests;
  let interests;
  
  const userParams = {
    TableName: tableNameUser,
    Key: {
      id: userID
    }
  };
  try {
    const userData = await ddbDocClient.send(new GetCommand(userParams));
    if (userData.Item && userData.Item.interests) {
      interests = userData.Item.interests;
    }
    res.json({ success: 'post call succeed!', url: req.url, data: userData })
  } catch (err) {
    res.statusCode = 500;
    res.json({ error: err, url: req.url, body: req.body });
  }
  
  interests.push(tag);
  
  const userUpdateParams = {
  TableName: tableNameUser,
  Key: {
    id: userID
  },
  UpdateExpression: 'SET interests = :newinterests',
  ExpressionAttributeValues: {
    ':newinterests': interests
  },
  ReturnValues: 'ALL_NEW'
  };
  
  try {
    const userData = await ddbDocClient.send(new UpdateCommand(userUpdateParams));
    res.json({ success: 'update call succeeded!', url: req.url, userData});
  } catch (err) {
    // Handle conditional update failure here
    res.status(409).json({ error: 'Data has changed since you last read it', url: req.url });
  }

});

/************************************
* HTTP post method for insert event * Done
*************************************/

app.post("/event/:user", async function(req, res) {
  const userID = req.params.user;
  let eventsHosting, eventsAttending;
  
  if (userIdPresent) {
    req.body['userId'] = req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
  }

  const timestamp = new Date().toISOString();
  const eventID = uuidv4();

  let putItemParams = {
    TableName: tableNameEvent,
    Item:  {
      id: eventID,
      hideLocation: true,
      date: timestamp,
      attendees: [userID],
      tags: [],
      reviews: [],
      genderPref: "None",
      paymentRequired: false,
      idRequired: false,
      host: userID,
      ...req.body
  }}
  
  const userParams = {
    TableName: tableNameUser,
    Key: {
      id: userID
    }
  };
  try {
    let data = await ddbDocClient.send(new PutCommand(putItemParams));
    const userData = await ddbDocClient.send(new GetCommand(userParams));
    if (userData.Item && userData.Item.eventsHosting && userData.item.eventsAttending) {
      eventsHosting = userData.Item.eventsHosting;
      eventsAttending = userData.Item.eventsAttending;
    }
    res.json({ success: 'post call succeed!', url: req.url, data: data })
  } catch (err) {
    res.statusCode = 500;
    res.json({ error: err, url: req.url, body: req.body });
  }
  
  eventsHosting.push(eventID);
  
  const userUpdateParams = {
  TableName: tableNameUser,
  Key: {
    id: userID
  },
  UpdateExpression: 'SET eventsHosting = :newHosting, eventsAttending = :newAttending',
  ExpressionAttributeValues: {
    ':newHosting': eventsHosting,
    ':newAttending': eventsAttending
  },
  ReturnValues: 'ALL_NEW'
  };
  
  try {
    const userData = await ddbDocClient.send(new UpdateCommand(userUpdateParams));
    res.json({ success: 'update call succeeded!', url: req.url, userData});
  } catch (err) {
    // Handle conditional update failure here
    res.status(409).json({ error: 'Data has changed since you last read it', url: req.url });
  }
});

/************************************
* HTTP post method for insert user * Done
*************************************/

app.post(userPath, async function(req, res) {
  
  if (userIdPresent) {
    req.body['userId'] = req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
  }

  let putItemParams = {
    TableName: tableNameUser,
    Item:  {
      id: uuidv4(),
      interests: [],
      eventsHosted: [],
      eventsAttended: [],
      eventsAttending: [],
      eventsHosting: [],
      reviews: [],
      ratingScore: 0,
      totalRatingScore: 0,
      ...req.body
  }}
  try {
    let data = await ddbDocClient.send(new PutCommand(putItemParams));
    res.json({ success: 'post call succeed!', url: req.url, data: data })
  } catch (err) {
    res.statusCode = 500;
    res.json({ error: err, url: req.url, body: req.body });
  }
});

/**************************************
* HTTP remove method to delete object * Done
***************************************/

app.delete(eventsPath + hashKeyPath, async function(req, res) {
    const params = {};
    if (userIdPresent && req.apiGateway) {
        params[partitionKeyName] = req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
    } else {
        params[partitionKeyName] = req.params[partitionKeyName];
        try {
            params[partitionKeyName] = convertUrlType(req.params[partitionKeyName], partitionKeyType);
        } catch(err) {
            res.statusCode = 500;
            res.json({error: 'Wrong column type ' + err});
        }
    }
    if (hasSortKey) {
        try {
            params[sortKeyName] = convertUrlType(req.params[sortKeyName], sortKeyType);
        } catch(err) {
            res.statusCode = 500;
            res.json({error: 'Wrong column type ' + err});
        }
    }
    
    let deleteItemParams = {
        TableName: tableNameEvent,
        Key: params
        
    }

    try {
        const data = await ddbDocClient.send(new DeleteCommand(deleteItemParams));
        res.json({success: 'delete call succeed!', url: req.url, data: data});
    } catch (err) {
        res.statusCode = 500;
        res.json({error: 'Could not load items: ' + err.message});
    }
});

/**************************************
* HTTP remove method to delete user * Done
***************************************/

app.delete(userPath + hashKeyPath, async function(req, res) {
  const params = {};
  if (userIdPresent && req.apiGateway) {
    params[partitionKeyName] = req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
  } else {
    params[partitionKeyName] = req.params[partitionKeyName];
     try {
      params[partitionKeyName] = convertUrlType(req.params[partitionKeyName], partitionKeyType);
    } catch(err) {
      res.statusCode = 500;
      res.json({error: 'Wrong column type ' + err});
    }
  }
  if (hasSortKey) {
    try {
      params[sortKeyName] = convertUrlType(req.params[sortKeyName], sortKeyType);
    } catch(err) {
      res.statusCode = 500;
      res.json({error: 'Wrong column type ' + err});
    }
  }

  let removeItemParams = {
    TableName: tableNameUser,
    Key: params
  }

  try {
    let data = await ddbDocClient.send(new DeleteCommand(removeItemParams));
    res.json({url: req.url, data: data});
  } catch (err) {
    res.statusCode = 500;
    res.json({error: err, url: req.url});
  }
});






// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app


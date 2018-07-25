var mode=process.env.NODE_ENV? process.env.NODE_ENV : "development";

switch(mode) {
  case "development":
  
      config=require('./development.js');
      break;

    
  case "production":
      
      config =require("./production.js");
      break;
      case "docker_dev":
      
      config =require("./docker_dev.js");
      break;
      case "docker_staging":
      
      config =require("./docker_staging.js");
      break;
      case "docker_production":
      
      config =require("./docker_production.js");
      break;
      case "staging":
      
      config =require("./staging.js");
      break;
      case "feature":
      config =require("./feature.js");
      break;
      case "feature1":
      config =require("./feature1.js");
      break;
  default:
      config=require("./development.js");
  
}
module.exports=config

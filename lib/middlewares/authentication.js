module.exports={

checkAuthentication:function(req,res,next){
    
        var check=true;
        if(check){
          next();
        }else{
          res.status(400).json({status:200,message:"User Not authenticated"})
        }
    }



}

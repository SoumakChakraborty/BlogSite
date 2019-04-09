var express=require("express");
var encrypt=require("./modules/Encrypt");
var conn=require("./modules/connection");
var app=express();
var email=require("emailjs");
var file=require("fs-extra");
var file_upload=require("express-fileupload");
app.use(file_upload());
var body=require("body-parser");
var method=require("method-override");
var session=require("express-session");
var flash=require("connect-flash");
var sanit=require("express-sanitizer");
app.use(sanit());
app.set("view engine","ejs");
app.use(method("_method"));
app.use(express.static("public"));
app.use(session({
   secret:"This is my session",
   resave:false,
   saveUninitialized:false
}));
app.use(flash());
app.use(body.urlencoded({extended:true}));
app.get("/",function(req,res)
{
   res.render("landing");
});
app.get("/signin",function(req,res)
{
    res.render("signin",{msg:req.flash("msg")});
});
app.post("/signin",function(req,res)
{
    var username=req.body.username;
    var password=req.body.password;
    var encrypted_password=encrypt_password(password);
    conn.query("select * from user where username='"+username+"'",function(err,result,fields)
    {
           if(result.length==0)
           {
              req.flash("msg","Username does not exist");
              res.redirect("/signin");
           }
           else
           {
              if(result[0].password!=encrypted_password)
              {
               req.flash("msg","Wrong password");
               res.redirect("/signin");
              }
              else
              {
                Store(username,req.connection.remoteAddress,req.headers["user-agent"]);
                res.redirect("/blog");
              }
           }
    });
});
app.get("/signup",function(req,res)
{
     res.render("signup");
});
app.post("/signup",function(req,res)
{
   var fname=req.body.fname;
   var lname=req.body.lname;
   var uname=req.body.uname;
   var password=req.body.password;
   password=encrypt_password(password);
   conn.query("insert into user values('"+uname+"'"+","+"'"+fname+"'"+","+"'"+lname+"'"+","+"'"+password+"'"+")",function(err,result,fields)
   {
         if(err)
           console.log(err);
   });
   res.redirect("/signin");
});
app.get("/blog",function(req,res)
{
   var IP=req.connection.remoteAddress;
   var headers=req.headers["user-agent"];
   var sessid=encrypt(IP+""+headers);
   var flag=false;
   conn.query("select * from state where IP='"+IP+"'"+"and sessid='"+sessid+"'",function(error,result,fields)
   {
         conn.query("select * from blog B join (select * from photo)P where B.blog_ID=P.blog_id",function(err,results,field)
         {
              if(result.length==0)
                res.render("showblog",{result:results,state:false});
              else
               res.render("showblog",{username:result[0].username,result:results,state:true});
         });    
   });
});
app.get("/new/blog/:user",function(req,res)
{
   conn.query("select * from state where username='"+req.params.user+"'",function(error,result,fields)
   {
       if(result.length==0)
       {
         req.flash("msg","You must be signed in");  
         res.redirect("/signin"); 
       }
       else
        res.render("newblog",{username:req.params.user});
   });
});
app.post("/new/blog/:user",function(req,res)
{
   conn.query("select * from state where username='"+req.params.user+"'",function(error,result,fields)
   {
       if(result.length==0)
       {
         req.flash("msg","You must be signed in");  
         res.redirect("/signin");
       }
       else
       {
         var title=req.sanitize(req.body.blogtitle);
         var type=req.body.type;
         var img=req.files.file;
         var description=req.sanitize(req.body.description);
         var d=new Date();
         var created=d.getDate()+"/"+(d.getMonth()+1)+"/"+d.getFullYear();
         conn.query("insert into blog(username,title,type,content,created) values('"+req.params.user+"'"+","+"'"+title+"'"+","+"'"+type+"'"+","+"'"+description+"'"+","+"'"+created+"'"+")",function(err,result,fields)
         {
            if(err)
             console.log(err);
         });
         file.mkdir("./public/uploads/"+req.params.user,function(error)
         {
            if(error)
              console.log(error);
         });   
        file.mkdir("./public/uploads/"+req.params.user+"/"+"blog_"+title,function(error)
        {
           if(error)
             console.log(error);
        });
        var t;
        if(img.name.indexOf("jpg")!=-1)
          t="jpg";
        else if(img.name.indexOf("png")!=-1)
         t="png";
        img.mv("./public/uploads/"+req.params.user+"/"+"blog_"+title+"/"+"content-img."+t,function(err)
        {
              if(err)
                console.log(err);
        });
        conn.query("select * from blog where username='"+req.params.user+"'"+"and title='"+title+"'",function(err,result,field)
        {
           conn.query("insert into photo values('"+result[0].blog_ID+"'"+","+"'"+"content-img."+t+"'"+")",function(error,results,fields)
           {
           });
        });
       res.redirect("/blog");
        }
   });
      
});
app.get("/view/blog/:id",function(req,res)
{
         var q="select * from user U natural join (select * from blog B natural join (select * from photo) P)BP where blog_ID='"+req.params.id+"'";
        conn.query(q,function(err,result,fields)
       {
      if(err)
        console.log(err);
       res.render("particular",{result:result});
       });
});
app.get("/edit/blog/:user/:id",function(req,res)
{
   conn.query("select * from state where username='"+req.params.user+"'",function(error,result,fields)
   {
       if(result.length==0)
       {
         req.flash("msg","You must be signed in");  
         res.redirect("/signin"); 
       }
       else
       {
         conn.query("select * from blog where blog_ID='"+req.params.id+"'",function(err,result,fields)
         {
             res.render("editblog",{result:result});
         });
       }
   });
});
app.put("/edit/blog/:user/:id",function(req,res)
{
   conn.query("select * from state where username='"+req.params.user+"'",function(error,result,fields)
   {
       if(result.length==0)
       {
         req.flash("msg","You must be signed in");  
         res.redirect("/signin"); 
       }
       else
       {
         var title=req.sanitize(req.body.blogtitle);
         var type=req.body.type;
         var img=req.files.file;
         var description=req.sanitize(req.body.description);
         var d=new Date();
         var created=d.getDate()+"/"+(d.getMonth()+1)+"/"+d.getFullYear();
         conn.query("update blog set title='"+title+"'"+" where blog_ID='"+req.params.id+"'",function(err,result,fields)
         {
            if(err)
             console.log(err);
         });
         conn.query("update blog set type='"+type+"'"+" where blog_ID='"+req.params.id+"'",function(err,result,fields)
         {
         });
         conn.query("update blog set description='"+description+"'"+" where blog_ID='"+req.params.id+"'",function(err,result,fields)
         {
         });
         conn.query("update blog set created='"+created+"'"+" where blog_ID='"+req.params.id+"'",function(err,result,fields)
         {
         });
         var t;
         if(img.name.indexOf("jpg")!=-1)
           t="jpg";
         else if(img.name.indexOf("png")!=-1)
          t="png";  
       conn.query("select * from photo where blog_ID='"+req.params.id+"'",function(err,result,fields)
       {
         file.unlinkSync("./public/uploads/"+req.params.user+"/"+"blog_"+title+"/"+"content-img."+t,function(error)
         {
               if(error)
                console.log(error);
         });
           img.mv("./public/uploads/"+req.params.user+"/"+"blog_"+title+"/"+"content-img."+t,function(error)
         {
               if(error)
                 console.log(error);
         });
       }); 
       conn.query("update photo set photo_name='"+"content-img."+t+"'"+" where blog_ID='"+req.params.id+"'",function(err,result,fields)
       {
       });
       res.redirect("/blog");
      }
   });
   
});
app.delete("/delete/blog/:user/:id",function(req,res)
{
   conn.query("select * from state where username='"+req.params.user+"'",function(error,result,fields)
   {
       if(result.length==0)
       {
         req.flash("msg","You must be signed in");  
         res.redirect("/signin"); 
       }
       else
       {
         conn.query("select * from blog where blog_ID='"+req.params.id+"'",function(err,result,fields)
         {
            file.remove("./public/uploads/"+req.params.user+"/"+"blog_"+result[0].title);
         });
         conn.query("delete from blog where username='"+req.params.user+"'"+" and blog_ID='"+req.params.id+"'",function(err,result,fields)
         {
         });
         conn.query("delete from photo where blog_ID='"+req.params.id+"'",function(e,r,f)
         {
         });
         res.redirect("/blog");
       }
   });
   
});
app.get("/signout",function(req,res)
{
    var IP=req.connection.remoteAddress;
    var header=req.headers["user-agent"];
    var sessid=encrypt(IP+""+header);
    conn.query("delete from state where IP='"+IP+"'"+"and sessid='"+sessid+"'",function(err,result,fields)
    {
    });  
  res.redirect("/blog");  
});
app.get("/changepassword/:user",function(req,res)
{
   conn.query("select * from state where username='"+req.params.user+"'",function(error,result,fields)
   {
       if(result.length==0)
       {
         req.flash("msg","You must be signed in");  
         res.redirect("/signin"); 
       }
       else
        res.render("changepass",{username:req.params.user});
   });
});
app.put("/changepassword/:user",function(req,res)
{
    var pass=req.body.password;
    var enc=encrypt_password(pass);
    conn.query("update user set password='"+enc+"'"+" where username='"+req.params.user+"'",function(err,result,fields)
    {
    });
    res.redirect("/blog");
});
app.get("/forgotpass",function(req,res)
{
   res.render("forgotpass");
});
app.post("/forgotpass",function(req,res)
{
   var usermail=req.body.uname;
    var server=email.server.connect({
       user:"yelpcamp500@gmail.com",
       password:"Windows90#",
       host:"smtp.gmail.com",
       ssl:true
    });
    server.send({
       from:"yelpcamp500@gmail.com",
       to:usermail,
       text:"Please click on the link: http://localhost:3000/resetpass/"+usermail+"\n to reset your password\n\n Yours faithfully,\nBlog team"
    },function(err,msg)
    {
         console.log(err||msg);
    });
   res.redirect("/signin"); 
});
app.get("/resetpass/:user",function(req,res)
{
    res.render("reset",{username:req.params.user});
});
app.put("/resetpass/:user",function(req,res)
{
   var pass=req.body.password;
   var enc=encrypt_password(pass);
   conn.query("update user set password='"+enc+"'"+" where username='"+req.params.user+"'",function(err,result,fields)
   {
   });
   res.redirect("/signin");
});
app.listen(3000,"127.0.0.1",function()
{
     console.log("Server started");
});
function encrypt_password(password)
{
   var firstencrypt=encrypt(password);
   var secondencrypt=encrypt("P"+firstencrypt+"D");
   return secondencrypt;
}
function Store(uname,IP,header)
{
   var sessid=encrypt(IP+""+header);
   conn.query("insert into state values('"+IP+"'"+","+"'"+sessid+"'"+","+"'"+uname+"'"+")",function(err,result,fields)
   {
      if(err)
        console.log(err);
   });
}
